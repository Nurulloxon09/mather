import "server-only";
import { addAttempts, attemptsForSession, grade, type Attempt, type AttemptInput, type ProgressMap } from "@/lib/attempts";
import type { SessionSummary } from "@/lib/history";
import { estimateScore } from "@/lib/score";
import type { AttemptRow } from "@/lib/stats";
import { sessionLabel, sessionScore, type ModuleState, type Session } from "@/lib/session";
import type { Question } from "@/lib/types";
import { getBankById } from "./bank";
import { getDb, type Row, type Statement } from "./db";

export type { SessionSummary };

// ---------- Input checks (the sync endpoint is reachable by anyone with the URL) ----------

const str = (v: unknown, max: number): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
const num = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const EARLIEST = Date.UTC(2024, 0, 1);
const okTime = (v: unknown): v is number => num(v) && v >= EARLIEST && v <= Date.now() + 86_400_000;

function cleanAttempt(v: unknown, byId: Map<string, Question>): Attempt | null {
  if (!v || typeof v !== "object") return null;
  const a = v as Record<string, unknown>;
  if (!str(a.sessionId, 40) || !str(a.questionId, 80) || a.id !== `${a.sessionId}:${a.questionId}`) return null;
  if (a.mode !== "practice" && a.mode !== "exam") return null;
  if (a.answer !== null && !str(a.answer, 8)) return null;
  if (!num(a.timeMs) || !okTime(a.createdAt)) return null;
  const q = byId.get(a.questionId);
  if (!q) return null;
  const input: AttemptInput = {
    id: a.id,
    sessionId: a.sessionId,
    questionId: a.questionId,
    mode: a.mode,
    answer: a.answer,
    timeMs: Math.max(0, Math.min(Math.round(a.timeMs), 6 * 3_600_000)),
    marked: a.marked === true,
    createdAt: Math.round(a.createdAt),
  };
  return grade(input, q);
}

function okModule(v: unknown): v is ModuleState {
  if (!v || typeof v !== "object") return false;
  const m = v as Record<string, unknown>;
  return (
    Array.isArray(m.questionIds) &&
    m.questionIds.length <= 100 &&
    m.questionIds.every((id) => str(id, 80)) &&
    !!m.items &&
    typeof m.items === "object"
  );
}

function cleanSession(v: unknown): Session | null {
  if (!v || typeof v !== "object") return null;
  const s = v as Record<string, unknown>;
  if (!str(s.id, 40) || !okTime(s.createdAt) || !okTime(s.finishedAt)) return null;
  if (s.mode === "practice") {
    if (!str(s.title, 160) || !okModule(s.module)) return null;
  } else if (s.mode === "exam") {
    if (!Array.isArray(s.modules) || s.modules.length < 1 || s.modules.length > 2 || !s.modules.every(okModule)) {
      return null;
    }
    if (s.custom !== undefined && !str(s.custom, 160)) return null;
  } else {
    return null;
  }
  const rest = { ...s };
  delete rest.syncedAt;
  return rest as unknown as Session;
}

// ---------- Writes ----------

function attemptStatement(a: Attempt): Statement {
  return {
    sql: `INSERT INTO attempts (id, session_id, question_id, mode, answer, correct, time_ms, marked, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            answer = excluded.answer, correct = excluded.correct,
            time_ms = excluded.time_ms, marked = excluded.marked`,
    args: [a.id, a.sessionId, a.questionId, a.mode, a.answer, a.correct ? 1 : 0, a.timeMs, a.marked ? 1 : 0, a.createdAt],
  };
}

export type SyncResult = { ok: true; attempts: number; sessions: number } | { ok: false; status: number; error: string };

/** Save attempts and finished sessions sent by the browser. Safe to repeat: everything is keyed by id. */
export async function syncProgress(body: unknown): Promise<SyncResult> {
  const db = await getDb();
  if (!db) return { ok: false, status: 503, error: "no-database" };
  if (!body || typeof body !== "object") return { ok: false, status: 400, error: "bad-request" };
  const { attempts = [], sessions = [] } = body as { attempts?: unknown; sessions?: unknown };
  if (!Array.isArray(attempts) || !Array.isArray(sessions) || attempts.length > 2000 || sessions.length > 200) {
    return { ok: false, status: 400, error: "bad-request" };
  }

  const byId = await getBankById();
  const statements: Statement[] = [];
  let nAttempts = 0;
  const seen = new Set<string>();
  const addAttempt = (a: Attempt | null) => {
    if (!a || seen.has(a.id)) return;
    seen.add(a.id);
    statements.push(attemptStatement(a));
    nAttempts++;
  };

  let nSessions = 0;
  // A finished session holds the final state of its attempts, so they're derived from it
  // and win over loose attempts with the same id (sent earlier, e.g. on Check).
  for (const raw of sessions) {
    const s = cleanSession(raw);
    if (!s) continue;
    const derived = attemptsForSession(s).map((a) => cleanAttempt(a, byId));
    for (const a of derived) addAttempt(a);
    const { correct, total } = sessionScore(s, byId);
    statements.push({
      sql: `INSERT INTO sessions (id, mode, title, created_at, finished_at, correct, total, data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              title = excluded.title, finished_at = excluded.finished_at,
              correct = excluded.correct, total = excluded.total, data = excluded.data`,
      args: [s.id, s.mode, sessionLabel(s), s.createdAt, s.finishedAt!, correct, total, JSON.stringify(s)],
    });
    nSessions++;
  }
  for (const raw of attempts) addAttempt(cleanAttempt(raw, byId));

  if (statements.length) await db.batch(statements);
  return { ok: true, attempts: nAttempts, sessions: nSessions };
}

// ---------- Reads ----------

function toAttempt(r: Row): Attempt {
  return {
    id: String(r.id),
    sessionId: String(r.session_id),
    questionId: String(r.question_id),
    mode: r.mode === "exam" ? "exam" : "practice",
    answer: r.answer === null ? null : String(r.answer),
    correct: Number(r.correct) === 1,
    timeMs: Number(r.time_ms),
    marked: Number(r.marked) === 1,
    createdAt: Number(r.created_at),
  };
}

/** Per-question progress, or null when there's no database. */
export async function getProgress(): Promise<ProgressMap | null> {
  const db = await getDb();
  if (!db) return null;
  const res = await db.execute(
    `SELECT id, session_id, question_id, mode, answer, correct, time_ms, marked, created_at
     FROM attempts ORDER BY created_at`,
  );
  return addAttempts({}, res.rows.map(toAttempt));
}

export async function listSessions(limit = 1000): Promise<SessionSummary[] | null> {
  const db = await getDb();
  if (!db) return null;
  const res = await db.execute({
    sql: `SELECT s.id, s.mode, s.title, s.finished_at, s.correct, s.total,
            ${db.json("s.data", "custom")} AS custom, ${db.json("s.data", "route")} AS route,
            COALESCE(a.t, 0) AS time_ms
          FROM sessions s
          LEFT JOIN (SELECT session_id, SUM(time_ms) AS t FROM attempts GROUP BY session_id) a ON a.session_id = s.id
          ORDER BY s.finished_at DESC LIMIT ?`,
    args: [limit],
  });
  return res.rows.map((r): SessionSummary => {
    const mode = r.mode === "exam" ? "exam" : "practice";
    const kind = mode === "practice" ? "practice" : r.custom ? "timed" : "exam";
    const route = r.route === "harder" || r.route === "easier" ? r.route : undefined;
    const correct = Number(r.correct);
    const total = Number(r.total);
    return {
      id: String(r.id),
      mode,
      kind,
      title: String(r.title),
      finishedAt: Number(r.finished_at),
      correct,
      total,
      timeMs: Number(r.time_ms),
      route,
      estimate: kind === "exam" ? estimateScore(correct, total, route) : undefined,
    };
  });
}

/** Every attempt in the compact form the stats page uses. */
export async function getAttemptRows(): Promise<AttemptRow[] | null> {
  const db = await getDb();
  if (!db) return null;
  const res = await db.execute(
    `SELECT question_id, session_id, correct, time_ms, created_at, mode FROM attempts ORDER BY created_at`,
  );
  return res.rows.map((r) => [
    String(r.question_id),
    String(r.session_id),
    Number(r.correct) ? 1 : 0,
    Number(r.time_ms),
    Number(r.created_at),
    r.mode === "exam" ? 1 : 0,
  ]);
}

export async function getStoredSession(id: string): Promise<Session | null> {
  const db = await getDb();
  if (!db || !str(id, 40)) return null;
  const res = await db.execute({ sql: `SELECT data FROM sessions WHERE id = ?`, args: [id] });
  if (!res.rows.length) return null;
  return JSON.parse(String(res.rows[0].data)) as Session;
}

/** Run a read, turning a database outage into `null` so pages still render from browser data. */
export async function orNull<T>(read: () => Promise<T | null>): Promise<{ data: T | null; error: boolean }> {
  try {
    return { data: await read(), error: false };
  } catch (err) {
    console.error("database read failed", err);
    return { data: null, error: true };
  }
}
