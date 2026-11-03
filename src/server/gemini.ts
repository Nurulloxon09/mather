import "server-only";
import { DIFFICULTIES, DOMAINS, SKILLS, type Difficulty, type Domain, type Question } from "@/lib/types";
import { cleanAnswer, type PendingFigure } from "@/lib/uploads";

// Gemini API (generativelanguage.googleapis.com) over plain fetch.
// GEMINI_API_KEY is required; GEMINI_MODEL picks the default model; GEMINI_BASE_URL is for tests.

const DEFAULT_MODEL = "gemini-flash-latest";
const LITE_MODEL = "gemini-flash-lite-latest";

export function geminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

/** Models the upload page offers. The default can be overridden with GEMINI_MODEL. */
export function geminiModels() {
  const main = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const models = [{ id: main, label: "Flash (best quality)" }];
  if (main !== LITE_MODEL) models.push({ id: LITE_MODEL, label: "Flash-Lite (more requests per day)" });
  return models;
}

export class GeminiError extends Error {
  constructor(
    public kind: "config" | "auth" | "rate" | "daily" | "too-long" | "blocked" | "bad-output" | "upstream",
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

type Schema = {
  type: "OBJECT" | "ARRAY" | "STRING" | "INTEGER" | "BOOLEAN";
  description?: string;
  enum?: string[];
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  propertyOrdering?: string[];
};

const obj = (properties: Record<string, Schema>, description?: string): Schema => ({
  type: "OBJECT",
  description,
  properties,
  required: Object.keys(properties),
  propertyOrdering: Object.keys(properties),
});
const str = (description?: string, values?: readonly string[]): Schema => ({
  type: "STRING",
  description,
  ...(values ? { enum: [...values] } : {}),
});
const int = (description?: string): Schema => ({ type: "INTEGER", description });
const arr = (items: Schema, description?: string): Schema => ({ type: "ARRAY", items, description });

const ALL_SKILLS = DOMAINS.flatMap((d) => SKILLS[d]);

async function generate(model: string, system: string, parts: Part[], schema: Schema, maxOutputTokens: number) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("config", "GEMINI_API_KEY is not set");
  if (!/^[a-z0-9.\-]+$/i.test(model)) throw new GeminiError("config", `Unknown model "${model}"`);
  const base = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";

  let res: Response;
  try {
    res = await fetch(`${base}/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
      cache: "no-store",
    });
  } catch (err) {
    throw new GeminiError("upstream", `Couldn't reach Gemini: ${(err as Error).message}`);
  }

  const body = (await res.json().catch(() => null)) as GeminiResponse | null;
  if (!res.ok) throw toError(res.status, body);

  const cand = body?.candidates?.[0];
  if (!cand) {
    const reason = body?.promptFeedback?.blockReason;
    throw new GeminiError("blocked", reason ? `Gemini blocked the request (${reason})` : "Gemini returned nothing");
  }
  const text = (cand.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
  if (cand.finishReason === "MAX_TOKENS") throw new GeminiError("too-long", "The answer was too long for one request");
  if (cand.finishReason && !["STOP", "FINISH_REASON_UNSPECIFIED"].includes(cand.finishReason) && !text) {
    throw new GeminiError(
      "blocked",
      cand.finishReason === "RECITATION"
        ? "Gemini declined to copy this text word for word (RECITATION). Try these pages again or with the other model."
        : `Gemini stopped early (${cand.finishReason})`,
    );
  }
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as unknown;
  } catch {
    throw new GeminiError("bad-output", "Gemini's answer wasn't valid JSON");
  }
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { code?: number; message?: string; status?: string; details?: Record<string, unknown>[] };
};

function toError(status: number, body: GeminiResponse | null) {
  const msg = body?.error?.message ?? `HTTP ${status}`;
  const details = body?.error?.details ?? [];
  if (status === 429) {
    const retry = details.find((d) => String(d["@type"]).endsWith("RetryInfo"))?.retryDelay as string | undefined;
    const seconds = retry ? Math.ceil(parseFloat(retry)) : 30;
    const daily = JSON.stringify(details).includes("PerDay") || /per day/i.test(msg);
    return daily
      ? new GeminiError("daily", "The free daily limit for this model is used up. Try the other model, or continue tomorrow.", seconds)
      : new GeminiError("rate", "Rate limit reached", seconds);
  }
  if (status === 400 && /API key/i.test(msg)) return new GeminiError("auth", "The Gemini API key isn't valid");
  if (status === 401 || status === 403) return new GeminiError("auth", `Gemini rejected the API key: ${msg}`);
  if (status === 404) return new GeminiError("config", `Model not found: ${msg}`);
  if (status === 503 || status === 500) return new GeminiError("rate", "Gemini is busy right now", 20);
  return new GeminiError("upstream", `Gemini error: ${msg}`);
}

// ---------- Extraction ----------

const MARKUP_RULES = `Markup for every text field (stem, choices, explanation):
- Math in LaTeX: inline as $...$, a displayed equation alone on its line as $$...$$. Use \\frac, \\sqrt, ^{}, _{}, \\le, \\ge, \\ne, \\pi, ^{\\circ}, \\angle, \\overline{AB}, \\text{...}. Systems of equations: $$\\begin{aligned} ... \\\\ ... \\end{aligned}$$.
- A real dollar sign (money) is written \\$ so it isn't read as math, e.g. \\$15.50.
- Paragraphs are separated by a blank line.
- Tables: one row per line, cells between | characters, e.g. "| x | y |". After a header row add "|---|---|". A table title goes on the line just above the table.
- Bold: **text**. Bullet lists: lines starting with "- ".
- Where the question shows a graph, diagram, number line, scatterplot or other picture, write [[FIGURE 1]] (then [[FIGURE 2]], ...) alone on its line at that spot, and list each in "figures". A figure inside an answer choice goes inside that choice. Tables are written as tables, not figures.
- Don't include the question number, the choice letters, or answer bubbles.`;

const EXTRACT_SYSTEM = `You transcribe Digital SAT math questions from page images of a prep book into JSON, exactly as printed.

${MARKUP_RULES}

Rules:
- Each page image is preceded by its label, e.g. "Page 12". Use that number for "page" fields.
- One entry per numbered question. Copy the wording exactly; fix only obvious OCR-style glitches.
- "type": "mcq" when the question has answer choices A–D (give all 4 in order); otherwise "spr" (student-produced response / grid-in) with no choices.
- "section": the chapter or section heading the question falls under, as printed (numbers usually restart per section). Use the same wording for every question in that section. "" if there is none.
- "answers": the correct answer only if it's printed on these pages next to the question (a letter for mcq, the value for spr; list every accepted value). Otherwise [].
- "explanation": the book's explanation if it is printed with the question, else "". Never invent one.
- "complete": false if the question is cut off at the end of the last page given (it continues on a page you can't see).
- "figures": for each [[FIGURE n]], the page it's on and a tight bounding box [ymin, xmin, ymax, xmax] scaled 0–1000 on that page, covering the whole figure including axis labels.
- Pages that are an answer key or answer explanations go in "answerKey": one entry per question number with its section, answers, and the explanation text if given.
- Skip instructions, chapter introductions, worked examples that aren't numbered questions, and page headers/footers/watermarks.
- "domain", "skill": the official Digital SAT Math domain and skill. "difficulty": Easy, Medium or Hard for the real SAT; use the book's label if it prints one.
- If the pages contain no questions or keys, return empty lists.`;

const QUESTION_SCHEMA = obj({
  section: str("Section or chapter heading, as printed; empty if none"),
  number: int("Question number as printed"),
  page: int("Page label where the question starts"),
  type: str("mcq or spr", ["mcq", "spr"]),
  stem: str("Question text in the markup"),
  choices: arr(str(), "Exactly 4 choices for mcq, empty for spr"),
  answers: arr(str(), "Correct answer(s) if printed with the question, else empty"),
  explanation: str("Book's explanation if printed with the question, else empty"),
  figures: arr(
    obj({
      label: str("FIGURE 1, FIGURE 2, ..."),
      page: int("Page label the figure is on"),
      box: arr(int(), "[ymin, xmin, ymax, xmax], 0-1000"),
    }),
  ),
  domain: str(undefined, DOMAINS),
  skill: str(undefined, ALL_SKILLS),
  difficulty: str(undefined, DIFFICULTIES),
  complete: { type: "BOOLEAN", description: "False if cut off at the end of the last page" },
});

const KEY_SCHEMA = obj({
  section: str("Section the answer belongs to, as printed; empty if none"),
  number: int(),
  answers: arr(str()),
  explanation: str("Explanation text if given, else empty"),
  page: int(),
});

const EXTRACT_SCHEMA = obj({
  questions: arr(QUESTION_SCHEMA),
  answerKey: arr(KEY_SCHEMA),
});

export type ExtractedQuestion = {
  section: string;
  number: number;
  page: number;
  type: Question["type"];
  stem: string;
  choices: string[];
  answers: string[];
  explanation: string;
  figures: PendingFigure[];
  domain: Domain;
  skill: string;
  difficulty: Difficulty;
  complete: boolean;
};

export type KeyEntry = { section: string; number: number; answers: string[]; explanation: string; page: number };

/** A page image with its PDF text layer, or a chunk of a Word document as text plus its images. */
export type PageInput = { page: number; text: string; images: { mime: string; data: string }[]; isImage: boolean };

const asStr = (v: unknown) => (typeof v === "string" ? v : "");
const asInt = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : NaN);

/** Strip "A)" / "(B)" / "C." prefixes the model sometimes keeps on choices. */
const stripLetter = (c: string) => c.replace(/^\s*\(?[A-D][).:]\s+/, "").trim();

function cleanQuestion(raw: Record<string, unknown>, pages: number[]): ExtractedQuestion | null {
  const number = asInt(raw.number);
  if (!(number > 0)) return null;
  const type = raw.type === "spr" ? "spr" : "mcq";
  let domain = (DOMAINS as readonly string[]).includes(asStr(raw.domain)) ? (raw.domain as Domain) : "Algebra";
  let skill = asStr(raw.skill);
  if (!SKILLS[domain].includes(skill)) {
    // Trust the skill and fix the domain when they disagree; fall back to the domain's first skill.
    const owner = DOMAINS.find((d) => SKILLS[d].includes(skill));
    if (owner) domain = owner;
    else skill = SKILLS[domain][0];
  }
  const page = pages.includes(asInt(raw.page)) ? asInt(raw.page) : pages[0];
  const figures: PendingFigure[] = (Array.isArray(raw.figures) ? raw.figures : []).flatMap((f) => {
    const box = Array.isArray(f?.box) ? f.box.map((n: unknown) => Math.max(0, Math.min(1000, asInt(n)))) : [];
    if (box.length !== 4 || box.some(Number.isNaN) || box[2] <= box[0] || box[3] <= box[1]) return [];
    const label = asStr(f.label).toUpperCase().replace(/\s+/g, " ").trim() || "FIGURE 1";
    return [{ label, page: pages.includes(asInt(f.page)) ? asInt(f.page) : page, box: box as PendingFigure["box"] }];
  });
  const choices = type === "mcq" ? (Array.isArray(raw.choices) ? raw.choices : []).map((c) => stripLetter(asStr(c))) : [];
  return {
    section: asStr(raw.section).trim(),
    number,
    page,
    type,
    stem: asStr(raw.stem).trim(),
    choices,
    answers: (Array.isArray(raw.answers) ? raw.answers : []).map(asStr).filter(Boolean),
    explanation: asStr(raw.explanation).trim(),
    figures,
    domain,
    skill,
    difficulty: (DIFFICULTIES as readonly string[]).includes(asStr(raw.difficulty)) ? (raw.difficulty as Difficulty) : "Medium",
    complete: raw.complete !== false,
  };
}

/** Read the questions and answer-key entries on a few consecutive pages. */
export async function extractPages(pages: PageInput[], model: string, hints: { sections: string[]; current: string }) {
  const intro = [`Transcribe the SAT math questions and any answer key on these ${pages.length} page(s).`];
  if (hints.sections.length) {
    intro.push(`Section names used so far in this book: ${hints.sections.map((s) => JSON.stringify(s)).join(", ")}. Reuse the same wording when a question belongs to one of them.`);
  }
  if (hints.current) {
    intro.push(`The pages just before these were in section ${JSON.stringify(hints.current)}; questions before any new heading belong to it.`);
  }
  const parts: Part[] = [{ text: intro.join("\n") }];
  for (const p of pages) {
    parts.push({ text: `Page ${p.page}` });
    if (p.isImage) {
      for (const img of p.images) parts.push({ inlineData: { mimeType: img.mime, data: img.data } });
      if (p.text.trim()) {
        parts.push({
          text: `(Text layer of page ${p.page}; it may be out of order or missing math, so trust the image:)\n${p.text.slice(0, 6000)}`,
        });
      }
    } else {
      // A chunk of a Word document, already in the markup. Its pictures are attached after it.
      parts.push({
        text: `${p.text}\n\n(Pictures already appear as ![figure](/api/files/...) links: keep those links where they belong instead of using [[FIGURE n]].)`,
      });
      p.images.forEach((img, i) => {
        parts.push({ text: `Picture ${i + 1} on page ${p.page}:` }, { inlineData: { mimeType: img.mime, data: img.data } });
      });
    }
  }
  const out = (await generate(model, EXTRACT_SYSTEM, parts, EXTRACT_SCHEMA, 60000)) as {
    questions?: unknown[];
    answerKey?: unknown[];
  };
  const labels = pages.map((p) => p.page);
  const questions = (out.questions ?? []).flatMap((q) =>
    q && typeof q === "object" ? [cleanQuestion(q as Record<string, unknown>, labels)].filter((x) => !!x) : [],
  ) as ExtractedQuestion[];
  const answerKey: KeyEntry[] = (out.answerKey ?? []).flatMap((k) => {
    const e = k as Record<string, unknown>;
    const number = asInt(e?.number);
    if (!(number > 0)) return [];
    return [
      {
        section: asStr(e.section).trim(),
        number,
        answers: (Array.isArray(e.answers) ? e.answers : []).map(asStr).filter(Boolean),
        explanation: asStr(e.explanation).trim(),
        page: labels.includes(asInt(e.page)) ? asInt(e.page) : labels[0],
      },
    ];
  });
  return { questions, answerKey };
}

// ---------- Solving (a second opinion in the review screen) ----------

const SOLVE_SYSTEM = `You are an expert Digital SAT math tutor. Solve the question carefully and check your work.

${MARKUP_RULES}

Return "answer": the choice letter for multiple choice, or for a grid-in the exact value as a student would enter it (fraction like 7/2 or decimal; if several values are correct list the simplest one). Return "explanation": a concise step-by-step solution a student can follow, in the markup.`;

const SOLVE_SCHEMA = obj({
  answer: str("Choice letter, or the grid-in value"),
  explanation: str("Step-by-step solution in the markup"),
});

export async function solveQuestion(q: Question, images: { mime: string; data: string }[], model: string) {
  const lines = [`Question:\n${q.stem}`];
  if (q.type === "mcq") (q.choices ?? []).forEach((c, i) => lines.push(`${"ABCD"[i]}) ${c}`));
  else lines.push("(Grid-in: the student types the answer.)");
  const parts: Part[] = [{ text: lines.join("\n\n") }];
  for (const img of images) parts.push({ inlineData: { mimeType: img.mime, data: img.data } });
  const out = (await generate(model, SOLVE_SYSTEM, parts, SOLVE_SCHEMA, 16000)) as { answer?: unknown; explanation?: unknown };
  const raw = asStr(out.answer);
  return { answer: cleanAnswer(raw, q.type) ?? raw.trim(), explanation: asStr(out.explanation).trim() };
}
