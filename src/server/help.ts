import "server-only";
import { cleanGoal, type Goal } from "@/lib/plan";
import { isCorrect } from "@/lib/session";
import type { Question } from "@/lib/types";
import { getDb } from "./db";
import { fileIdsIn, readFile } from "./files";
import { GeminiError, geminiModels, tutorDesmos, tutorHints, tutorWhyWrong } from "./gemini";

export type HelpKind = "hints" | "wrong" | "desmos";

/** Bump when a prompt changes enough that saved answers should be asked for again. */
const PROMPT_VERSION = "1";

/** A short fingerprint of a question, so an edited question gets fresh help. */
function fingerprint(q: Question) {
  const text = [q.stem, ...(q.choices ?? []), q.answer ?? "", ...(q.gridAnswers ?? [])].join("\u0001");
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

type Image = { mime: string; data: string };

/**
 * The question's figures for the AI: uploaded ones from the database, the book's from the site
 * itself (public files aren't on the server's disk when deployed), sent with the visitor's cookie
 * so a passcode doesn't block them.
 */
async function figures(q: Question, origin: string, cookie: string | null): Promise<Image[]> {
  const text = [q.stem, ...(q.choices ?? [])].join("\n");
  const out: Image[] = [];
  const db = await getDb();
  if (db) {
    for (const id of fileIdsIn(text).slice(0, 6)) {
      const f = await readFile(db, id);
      if (f) out.push({ mime: f.mime, data: Buffer.from(f.data).toString("base64") });
    }
  }
  for (const m of [...text.matchAll(/\]\((\/figures\/[^)\s]+)\)/g)].slice(0, 6)) {
    try {
      const res = await fetch(new URL(m[1], origin), { headers: cookie ? { cookie } : {}, cache: "no-store" });
      const mime = res.headers.get("content-type") ?? "";
      if (res.ok && mime.startsWith("image/")) {
        out.push({ mime: mime.split(";")[0], data: Buffer.from(await res.arrayBuffer()).toString("base64") });
      }
    } catch {
      // A missing figure only makes the help a little less specific.
    }
  }
  return out;
}

/** Try the main model, then the lighter one when the main one is out of requests. */
async function withModels<T>(run: (model: string) => Promise<T>): Promise<T> {
  const models = geminiModels().map((m) => m.id);
  for (let i = 0; ; i++) {
    try {
      return await run(models[i]);
    } catch (err) {
      const busy = err instanceof GeminiError && (err.kind === "rate" || err.kind === "daily");
      if (!busy || i === models.length - 1) throw err;
    }
  }
}

export async function getHelp(
  kind: HelpKind,
  q: Question,
  answer: string,
  origin: string,
  cookie: string | null,
): Promise<unknown> {
  const id = [kind, q.id, fingerprint(q), PROMPT_VERSION, kind === "wrong" ? answer : ""].join(":");
  const db = await getDb();
  if (db) {
    const res = await db.execute({ sql: `SELECT data FROM ai_help WHERE id = ?`, args: [id] });
    if (res.rows.length) return JSON.parse(String(res.rows[0].data));
  }

  const images = await figures(q, origin, cookie);
  const out = await withModels<unknown>((model) => {
    if (kind === "hints") return tutorHints(q, images, model);
    if (kind === "wrong") return tutorWhyWrong(q, answer, images, model);
    return tutorDesmos(q, images, model, (a) => isCorrect(q, a));
  });

  // A walkthrough that couldn't be checked against the key isn't kept: the next try may do better.
  const keep = !(out && typeof out === "object" && "unverified" in out);
  if (db && keep) {
    await db.execute({
      sql: `INSERT INTO ai_help (id, question_id, kind, data, created_at) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET data = excluded.data, created_at = excluded.created_at`,
      args: [id, q.id, kind, JSON.stringify(out), Date.now()],
    });
  }
  return out;
}

// ---------- Settings ----------

export async function getGoal(): Promise<Goal | null> {
  const db = await getDb();
  if (!db) return null;
  const res = await db.execute({ sql: `SELECT value FROM settings WHERE key = 'goal'` });
  if (!res.rows.length) return null;
  try {
    return cleanGoal(JSON.parse(String(res.rows[0].value)));
  } catch {
    return null;
  }
}

/** Saves the goal unless the stored one is newer. Returns the goal now stored. */
export async function saveGoal(goal: Goal): Promise<Goal> {
  const db = await getDb();
  if (!db) return goal;
  const current = await getGoal();
  if (current && current.updatedAt > goal.updatedAt) return current;
  await db.execute({
    sql: `INSERT INTO settings (key, value, updated_at) VALUES ('goal', ?, ?)
          ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [JSON.stringify(goal), goal.updatedAt],
  });
  return goal;
}
