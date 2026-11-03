import "server-only";
import type { Client, InStatement, Row } from "@libsql/client";
import { DIFFICULTIES, DOMAINS, LETTERS, SKILLS, type ChoiceLetter, type Question } from "@/lib/types";
import {
  blankQuestion,
  cleanAnswer,
  FIGURE_RE,
  fileUrl,
  normalizeSection,
  type Draft,
  type DraftMeta,
  type DraftStatus,
  type UploadKind,
  type UploadPage,
  type UploadSummary,
} from "@/lib/uploads";
import { questionProblems } from "@/lib/validate";
import { getDb } from "./db";
import { fileIdsIn, newId, readFile, saveFile } from "./files";
import type { ExtractedQuestion, KeyEntry } from "./gemini";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[],
  ) {
    super(message);
  }
}

export async function requireDb(): Promise<Client> {
  const db = await getDb();
  if (!db) throw new HttpError(503, "No database is connected");
  return db;
}

// ---------- Uploads ----------

const SUMMARY_SQL = `
  SELECT u.id, u.name, u.source, u.kind, u.page_count, u.planned, u.created_at,
    (SELECT COUNT(*) FROM upload_pages p WHERE p.upload_id = u.id) AS pages_ready,
    (SELECT COUNT(*) FROM upload_pages p WHERE p.upload_id = u.id AND p.extracted_at IS NOT NULL) AS pages_extracted,
    (SELECT COUNT(*) FROM uploaded_questions q WHERE q.upload_id = u.id AND q.status = 'draft') AS drafts,
    (SELECT COUNT(*) FROM uploaded_questions q WHERE q.upload_id = u.id AND q.status = 'published') AS published,
    (SELECT COUNT(*) FROM uploaded_questions q WHERE q.upload_id = u.id AND q.status = 'rejected') AS rejected
  FROM uploads u`;

function toSummary(r: Row): UploadSummary {
  return {
    id: String(r.id),
    name: String(r.name),
    source: String(r.source),
    kind: String(r.kind) as UploadKind,
    pageCount: Number(r.page_count),
    planned: Number(r.planned),
    pagesReady: Number(r.pages_ready),
    pagesExtracted: Number(r.pages_extracted),
    drafts: Number(r.drafts),
    published: Number(r.published),
    rejected: Number(r.rejected),
    createdAt: Number(r.created_at),
  };
}

export async function createUpload(input: {
  name?: unknown;
  source?: unknown;
  kind?: unknown;
  pageCount?: unknown;
  planned?: unknown;
}) {
  const db = await requireDb();
  const name = String(input.name ?? "").trim().slice(0, 200);
  const source = String(input.source ?? "").trim().slice(0, 120);
  const kind = input.kind;
  const pageCount = Number(input.pageCount);
  const planned = Number(input.planned ?? input.pageCount);
  if (!name || !source) throw new HttpError(400, "Name and source are required");
  if (kind !== "pdf" && kind !== "images" && kind !== "docx") throw new HttpError(400, "Unsupported file type");
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > 2000) throw new HttpError(400, "Bad page count");
  if (!Number.isInteger(planned) || planned < 1 || planned > pageCount) throw new HttpError(400, "Bad page selection");
  const id = newId();
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO uploads (id, name, source, kind, page_count, planned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, name, source, kind, pageCount, planned, now, now],
  });
  return id;
}

export async function listUploads(): Promise<UploadSummary[] | null> {
  const db = await getDb();
  if (!db) return null;
  const res = await db.execute(`${SUMMARY_SQL} ORDER BY u.created_at DESC`);
  return res.rows.map(toSummary);
}

async function getSummary(db: Client, id: string) {
  const res = await db.execute({ sql: `${SUMMARY_SQL} WHERE u.id = ?`, args: [id] });
  if (!res.rows.length) throw new HttpError(404, "Upload not found");
  return toSummary(res.rows[0]);
}

export async function getUploadState(id: string) {
  const db = await requireDb();
  const upload = await getSummary(db, id);
  const pages = await db.execute({
    sql: `SELECT page, file_id, width, height, extracted_at,
            CASE WHEN file_id IS NULL THEN text ELSE NULL END AS text
          FROM upload_pages WHERE upload_id = ? ORDER BY page`,
    args: [id],
  });
  return {
    upload,
    pages: pages.rows.map(
      (r): UploadPage => ({
        page: Number(r.page),
        fileId: r.file_id === null ? null : String(r.file_id),
        width: r.width === null ? null : Number(r.width),
        height: r.height === null ? null : Number(r.height),
        extracted: r.extracted_at !== null,
        ...(r.text !== null && r.text !== undefined ? { text: String(r.text) } : {}),
      }),
    ),
    drafts: await listDrafts(db, id),
  };
}

export async function savePage(
  uploadId: string,
  page: { page: number; image?: { mime: string; data: Uint8Array }; width?: number; height?: number; text: string },
) {
  const db = await requireDb();
  const upload = await getSummary(db, uploadId);
  if (!Number.isInteger(page.page) || page.page < 1 || page.page > upload.pageCount) {
    throw new HttpError(400, "Page number out of range");
  }
  const old = await db.execute({
    sql: `SELECT file_id FROM upload_pages WHERE upload_id = ? AND page = ?`,
    args: [uploadId, page.page],
  });
  const fileId = page.image ? await saveFile(db, { uploadId, kind: "page", ...page.image }) : null;
  const stmts: InStatement[] = [
    {
      sql: `INSERT INTO upload_pages (upload_id, page, file_id, width, height, text, extracted_at)
            VALUES (?, ?, ?, ?, ?, ?, NULL)
            ON CONFLICT (upload_id, page) DO UPDATE SET
              file_id = excluded.file_id, width = excluded.width, height = excluded.height,
              text = excluded.text, extracted_at = NULL`,
      args: [uploadId, page.page, fileId, page.width ?? null, page.height ?? null, page.text.slice(0, 100_000)],
    },
    { sql: `UPDATE uploads SET updated_at = ? WHERE id = ?`, args: [Date.now(), uploadId] },
  ];
  const oldFile = old.rows[0]?.file_id;
  if (oldFile) stmts.push({ sql: `DELETE FROM files WHERE id = ?`, args: [String(oldFile)] });
  await db.batch(stmts, "write");
}

/** Page images (base64) and text for the pages the AI will read next. */
export async function loadPagesForAi(uploadId: string, pages: number[]) {
  const db = await requireDb();
  const res = await db.execute({
    sql: `SELECT page, file_id, text FROM upload_pages WHERE upload_id = ? AND page IN (${pages.map(() => "?").join(",")}) ORDER BY page`,
    args: [uploadId, ...pages],
  });
  if (res.rows.length !== pages.length) throw new HttpError(400, "Some of those pages haven't been uploaded");
  const out = [];
  for (const r of res.rows) {
    const text = String(r.text);
    const images: { mime: string; data: string }[] = [];
    if (r.file_id) {
      const f = await readFile(db, String(r.file_id));
      if (f) images.push({ mime: f.mime, data: Buffer.from(f.data).toString("base64") });
    }
    // Word documents: images inside the text are sent along so the AI can see them.
    for (const id of fileIdsIn(text).slice(0, 8)) {
      const f = await readFile(db, id);
      if (f) images.push({ mime: f.mime, data: Buffer.from(f.data).toString("base64") });
    }
    out.push({ page: Number(r.page), text, images, isImage: !!r.file_id });
  }
  return out;
}

/** Section names found so far, and the one in force just before `page`, to keep names consistent. */
export async function sectionHints(uploadId: string, page: number) {
  const db = await requireDb();
  const all = await db.execute({
    sql: `SELECT section, MIN(json_extract(data, '$.page')) AS p FROM uploaded_questions
          WHERE upload_id = ? AND section != '' GROUP BY section ORDER BY p`,
    args: [uploadId],
  });
  const prev = await db.execute({
    sql: `SELECT section FROM uploaded_questions WHERE upload_id = ? AND json_extract(data, '$.page') <= ?
          ORDER BY json_extract(data, '$.page') DESC, number DESC LIMIT 1`,
    args: [uploadId, page],
  });
  return { sections: all.rows.map((r) => String(r.section)), current: prev.rows[0] ? String(prev.rows[0].section) : "" };
}

/** Removes everything for an upload except published questions (and the figures they use). */
export async function deleteUpload(id: string) {
  const db = await requireDb();
  const summary = await getSummary(db, id);
  const stmts: InStatement[] = [
    { sql: `DELETE FROM files WHERE upload_id = ? AND kind = 'page'`, args: [id] },
    { sql: `DELETE FROM uploaded_questions WHERE upload_id = ? AND status != 'published'`, args: [id] },
    { sql: `DELETE FROM answer_keys WHERE upload_id = ?`, args: [id] },
  ];
  if (summary.published) {
    stmts.push({ sql: `UPDATE upload_pages SET file_id = NULL WHERE upload_id = ?`, args: [id] });
  } else {
    stmts.push(
      { sql: `DELETE FROM upload_pages WHERE upload_id = ?`, args: [id] },
      { sql: `DELETE FROM files WHERE upload_id = ?`, args: [id] },
      { sql: `DELETE FROM uploads WHERE id = ?`, args: [id] },
    );
  }
  await db.batch(stmts, "write");
}

// ---------- Drafts ----------

function toDraft(r: Row): Draft {
  return {
    id: String(r.id),
    uploadId: String(r.upload_id),
    status: String(r.status) as DraftStatus,
    question: JSON.parse(String(r.data)) as Question,
    meta: JSON.parse(String(r.meta)) as DraftMeta,
    updatedAt: Number(r.updated_at),
  };
}

async function listDrafts(db: Client, uploadId: string) {
  const res = await db.execute({
    sql: `SELECT * FROM uploaded_questions WHERE upload_id = ?
          ORDER BY json_extract(data, '$.page'), number, created_at`,
    args: [uploadId],
  });
  return res.rows.map(toDraft);
}

async function getDraft(db: Client, id: string) {
  const res = await db.execute({ sql: `SELECT * FROM uploaded_questions WHERE id = ?`, args: [id] });
  if (!res.rows.length) throw new HttpError(404, "Question not found");
  return toDraft(res.rows[0]);
}

function draftStatement(d: Draft, insert = false): InStatement {
  const now = Date.now();
  return insert
    ? {
        sql: `INSERT INTO uploaded_questions (id, upload_id, status, section, number, data, meta, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [d.id, d.uploadId, d.status, d.meta.section, d.question.sourceNumber, JSON.stringify(d.question), JSON.stringify(d.meta), now, now],
      }
    : {
        sql: `UPDATE uploaded_questions SET status = ?, section = ?, number = ?, data = ?, meta = ?, updated_at = ? WHERE id = ?`,
        args: [d.status, d.meta.section, d.question.sourceNumber, JSON.stringify(d.question), JSON.stringify(d.meta), now, d.id],
      };
}

/** Put every figure placeholder in canonical form, and make sure each listed figure appears somewhere. */
function placeFigures(q: Question, labels: string[]) {
  const canon = (s: string) => s.replace(FIGURE_RE, (_, l: string) => `[[${l.toUpperCase().replace(/\s+/g, " ")}]]`);
  q.stem = canon(q.stem);
  q.explanation = canon(q.explanation);
  if (q.choices) q.choices = q.choices.map(canon);
  const all = [q.stem, q.explanation, ...(q.choices ?? [])].join("\n");
  for (const l of labels) if (!all.includes(`[[${l}]]`)) q.stem += `\n\n[[${l}]]`;
}

function fromExtraction(uploadId: string, source: string, x: ExtractedQuestion, id = newId()): Draft {
  const answers = x.answers.map((a) => cleanAnswer(a, x.type)).filter((a): a is string => !!a);
  const choices = x.type === "mcq" ? [...x.choices, "", "", "", ""].slice(0, 4) : undefined;
  const question: Question = {
    id,
    source,
    sourceNumber: x.number,
    domain: x.domain,
    skill: x.skill,
    difficulty: x.difficulty,
    type: x.type,
    stem: x.stem,
    choices,
    answer: x.type === "mcq" ? (answers[0] as ChoiceLetter | undefined) : undefined,
    gridAnswers: x.type === "spr" ? [...new Set(answers)] : undefined,
    explanation: x.explanation,
    page: x.page,
    uploadId,
  };
  placeFigures(question, x.figures.map((f) => f.label));
  return {
    id,
    uploadId,
    status: "draft",
    question,
    meta: {
      section: x.section,
      complete: x.complete,
      figures: x.figures,
      answerFrom: answers.length ? "page" : null,
      edited: false,
    },
    updatedAt: Date.now(),
  };
}

const size = (q: Question) => q.stem.length + (q.choices ?? []).join("").length + q.explanation.length;

/**
 * Store what the AI read from a window of pages. Pages overlap between windows, so a question
 * already stored is only replaced by a more complete reading, and never once it's been edited.
 */
export async function recordExtraction(
  uploadId: string,
  pages: number[],
  result: { questions: ExtractedQuestion[]; answerKey: KeyEntry[] },
) {
  const db = await requireDb();
  const summary = await getSummary(db, uploadId);
  const drafts = await listDrafts(db, uploadId);
  const stmts: InStatement[] = [];
  let added = 0;
  let updated = 0;

  for (const x of result.questions) {
    const existing = drafts.find(
      (d) => d.question.sourceNumber === x.number && normalizeSection(d.meta.section) === normalizeSection(x.section),
    );
    if (!existing) {
      const d = fromExtraction(uploadId, summary.source, x);
      drafts.push(d);
      stmts.push(draftStatement(d, true));
      added++;
      continue;
    }
    if (existing.meta.edited || existing.status !== "draft") continue;
    const next = fromExtraction(uploadId, summary.source, x, existing.id);
    const better =
      (x.complete && !existing.meta.complete) ||
      (x.complete === existing.meta.complete && size(next.question) > size(existing.question) * 1.05);
    if (!better) continue;
    // Keep an answer that came from the answer key if this reading has none.
    if (existing.meta.answerFrom === "key" && next.meta.answerFrom === null) {
      next.question.answer = existing.question.answer;
      next.question.gridAnswers = existing.question.gridAnswers;
      next.meta.answerFrom = "key";
    }
    if (!next.question.explanation && existing.question.explanation) next.question.explanation = existing.question.explanation;
    Object.assign(existing, next);
    stmts.push(draftStatement(existing));
    updated++;
  }

  for (const k of result.answerKey) {
    stmts.push({
      sql: `INSERT INTO answer_keys (upload_id, section, number, answers, explanation, page) VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (upload_id, section, number) DO UPDATE SET
              answers = CASE WHEN excluded.answers != '[]' THEN excluded.answers ELSE answers END,
              explanation = CASE WHEN length(excluded.explanation) > length(explanation) THEN excluded.explanation ELSE explanation END`,
      args: [uploadId, k.section, k.number, JSON.stringify(k.answers), k.explanation, k.page],
    });
  }

  stmts.push({
    sql: `UPDATE upload_pages SET extracted_at = ? WHERE upload_id = ? AND page IN (${pages.map(() => "?").join(",")})`,
    args: [Date.now(), uploadId, ...pages],
  });
  await db.batch(stmts, "write");
  const keyed = await applyKeys(db, uploadId);
  return { added, updated, keys: result.answerKey.length, keyed };
}

/**
 * Match answer-key entries to questions by section and number. Section names in a key rarely
 * match the question pages word for word, so after exact matches, key sections are paired with
 * question sections in the order they appear in the book.
 */
async function applyKeys(db: Client, uploadId: string) {
  const keysRes = await db.execute({
    sql: `SELECT section, number, answers, explanation, page FROM answer_keys WHERE upload_id = ? ORDER BY page`,
    args: [uploadId],
  });
  if (!keysRes.rows.length) return 0;
  const keys = keysRes.rows.map((r) => ({
    section: normalizeSection(String(r.section)),
    number: Number(r.number),
    answers: JSON.parse(String(r.answers)) as string[],
    explanation: String(r.explanation),
    page: Number(r.page),
  }));
  const drafts = await listDrafts(db, uploadId);

  const order = (xs: { section: string; page: number }[]) =>
    [...new Map(xs.sort((a, b) => a.page - b.page).map((x) => [x.section, x])).keys()];
  const draftSections = order(drafts.map((d) => ({ section: normalizeSection(d.meta.section), page: d.question.page ?? 0 })));
  const keySections = order(keys.map((k) => ({ section: k.section, page: k.page })));
  const map = new Map<string, string>();
  for (const s of keySections) if (draftSections.includes(s)) map.set(s, s);
  const unmatchedKeys = keySections.filter((s) => !map.has(s));
  const unmatchedDrafts = draftSections.filter((s) => ![...map.values()].includes(s));
  if (unmatchedKeys.length === unmatchedDrafts.length) unmatchedKeys.forEach((s, i) => map.set(s, unmatchedDrafts[i]));

  const stmts: InStatement[] = [];
  for (const d of drafts) {
    if (d.status !== "draft" || d.meta.edited) continue;
    const sec = normalizeSection(d.meta.section);
    const sameNumber = keys.filter((k) => k.number === d.question.sourceNumber);
    const key =
      sameNumber.find((k) => map.get(k.section) === sec) ??
      (sameNumber.length === 1 && drafts.filter((x) => x.question.sourceNumber === d.question.sourceNumber).length === 1
        ? sameNumber[0]
        : undefined);
    if (!key) continue;

    const q = { ...d.question };
    const meta = { ...d.meta };
    const answers = key.answers.map((a) => cleanAnswer(a, q.type)).filter((a): a is string => !!a);
    const current = q.type === "mcq" ? (q.answer ? [q.answer] : []) : (q.gridAnswers ?? []);
    if (answers.length) {
      if (meta.answerFrom === "page" && current.length && answers.join() !== current.join()) {
        meta.keyConflict = answers;
      } else if (meta.answerFrom !== "page") {
        if (q.type === "mcq") q.answer = answers[0] as ChoiceLetter;
        else q.gridAnswers = [...new Set(answers)];
        meta.answerFrom = "key";
      }
    }
    if (!q.explanation && key.explanation) q.explanation = key.explanation;
    if (JSON.stringify(q) !== JSON.stringify(d.question) || JSON.stringify(meta) !== JSON.stringify(d.meta)) {
      stmts.push(draftStatement({ ...d, question: q, meta }));
    }
  }
  if (stmts.length) await db.batch(stmts, "write");
  return stmts.length;
}

/** Replace a figure placeholder with the cropped image. */
export async function resolveFigure(draftId: string, label: string, fileId: string, width: number) {
  const db = await requireDb();
  const d = await getDraft(db, draftId);
  const img = `![figure](${fileUrl(fileId)}){w=${Math.round(Math.max(60, Math.min(720, width)))}}`;
  const tag = `[[${label}]]`;
  const q = { ...d.question };
  q.stem = q.stem.split(tag).join(img);
  q.explanation = q.explanation.split(tag).join(img);
  if (q.choices) q.choices = q.choices.map((c) => c.split(tag).join(img));
  const meta = { ...d.meta, figures: d.meta.figures.filter((f) => f.label !== label) };
  await db.execute(draftStatement({ ...d, question: q, meta }));
  return { ...d, question: q, meta };
}

/** Accept edited question fields from the review screen, keeping ids and provenance fixed. */
function sanitize(base: Question, input: unknown): Question {
  if (!input || typeof input !== "object") throw new HttpError(400, "Bad question");
  const v = input as Record<string, unknown>;
  const text = (x: unknown, max = 20_000) => (typeof x === "string" ? x.slice(0, max) : "");
  const type = v.type === "spr" ? "spr" : "mcq";
  const domain = (DOMAINS as readonly string[]).includes(String(v.domain)) ? (v.domain as Question["domain"]) : base.domain;
  return {
    ...base,
    source: text(v.source, 120).trim() || base.source,
    sourceNumber: Number.isInteger(v.sourceNumber) && Number(v.sourceNumber) >= 0 ? Number(v.sourceNumber) : base.sourceNumber,
    domain,
    skill: typeof v.skill === "string" && SKILLS[domain].includes(v.skill) ? v.skill : SKILLS[domain][0],
    difficulty: (DIFFICULTIES as readonly string[]).includes(String(v.difficulty)) ? (v.difficulty as Question["difficulty"]) : base.difficulty,
    type,
    stem: text(v.stem),
    choices: type === "mcq" ? [0, 1, 2, 3].map((i) => text(Array.isArray(v.choices) ? v.choices[i] : "", 4000)) : undefined,
    answer: type === "mcq" && LETTERS.includes(v.answer as ChoiceLetter) ? (v.answer as ChoiceLetter) : undefined,
    gridAnswers:
      type === "spr" && Array.isArray(v.gridAnswers)
        ? v.gridAnswers.map((a) => text(a, 12).trim()).filter(Boolean).slice(0, 10)
        : undefined,
    explanation: text(v.explanation),
    flag: text(v.flag, 1000).trim() || undefined,
    page: Number.isInteger(v.page) ? Number(v.page) : base.page,
  };
}

export async function updateDraft(id: string, input: { question?: unknown; status?: unknown; section?: unknown }) {
  const db = await requireDb();
  const d = await getDraft(db, id);
  const question = input.question === undefined ? d.question : sanitize(d.question, input.question);
  const status = input.status === undefined ? d.status : (input.status as DraftStatus);
  if (!["draft", "published", "rejected"].includes(status)) throw new HttpError(400, "Bad status");
  const meta: DraftMeta = { ...d.meta };
  if (input.question !== undefined) {
    meta.edited = true;
    if (JSON.stringify([question.answer, question.gridAnswers]) !== JSON.stringify([d.question.answer, d.question.gridAnswers])) {
      meta.answerFrom = "editor";
      delete meta.keyConflict;
    }
  }
  if (typeof input.section === "string") meta.section = input.section.slice(0, 120);
  if (status === "published") {
    const problems = questionProblems(question);
    if (problems.length) throw new HttpError(422, "Fix these before publishing", problems);
  }
  const next = { ...d, status, question, meta };
  await db.execute(draftStatement(next));
  return next;
}

export async function saveAiSuggestion(id: string, ai: { answer: string; explanation: string }) {
  const db = await requireDb();
  const d = await getDraft(db, id);
  const next = { ...d, meta: { ...d.meta, ai: { ...ai, at: Date.now() } } };
  await db.execute(draftStatement(next));
  return next;
}

export async function getDraftById(id: string) {
  return getDraft(await requireDb(), id);
}

/** A blank question added by hand (for something the AI missed). */
export async function addDraft(uploadId: string, page: number) {
  const db = await requireDb();
  const summary = await getSummary(db, uploadId);
  const id = newId();
  const max = await db.execute({ sql: `SELECT MAX(number) AS n FROM uploaded_questions WHERE upload_id = ?`, args: [uploadId] });
  const question = { ...blankQuestion(id, summary.source, uploadId), sourceNumber: Number(max.rows[0]?.n ?? 0) + 1, page };
  const d: Draft = {
    id,
    uploadId,
    status: "draft",
    question,
    meta: { section: "", complete: true, figures: [], answerFrom: null, edited: true },
    updatedAt: Date.now(),
  };
  await db.execute(draftStatement(d, true));
  return d;
}

/** Published uploaded questions, for the bank and tests. */
export async function getPublishedQuestions(): Promise<Question[]> {
  const db = await getDb();
  if (!db) return [];
  const res = await db.execute(`SELECT data FROM uploaded_questions WHERE status = 'published'`);
  return res.rows.map((r) => JSON.parse(String(r.data)) as Question);
}
