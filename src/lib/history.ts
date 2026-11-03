import { estimateScore, type ScoreEstimate } from "./score";
import { sessionLabel, sessionModules, sessionScore, type Session } from "./session";
import type { Question } from "./types";

/** One finished practice set, timed set or full exam, as listed in history. */
export type SessionSummary = {
  id: string;
  mode: Session["mode"];
  /** Practice set, timed set (a one-module exam), or a full two-module exam. */
  kind: "practice" | "timed" | "exam";
  title: string;
  finishedAt: number;
  correct: number;
  total: number;
  /** Time spent on the questions. */
  timeMs: number;
  route?: "harder" | "easier";
  /** Full exams only. */
  estimate?: ScoreEstimate;
};

export function summarizeSession(s: Session, byId: Map<string, Question>): SessionSummary {
  const { correct, total } = sessionScore(s, byId);
  const kind = s.mode === "practice" ? "practice" : s.custom ? "timed" : "exam";
  const route = s.mode === "exam" ? s.route : undefined;
  return {
    id: s.id,
    mode: s.mode,
    kind,
    title: sessionLabel(s),
    finishedAt: s.finishedAt ?? s.createdAt,
    correct,
    total,
    timeMs: sessionModules(s).reduce((t, m) => t + Object.values(m.items).reduce((a, it) => a + (it?.timeMs ?? 0), 0), 0),
    route,
    estimate: kind === "exam" ? estimateScore(correct, total, route) : undefined,
  };
}

/**
 * Sessions from the database plus finished ones only this browser has (just finished and still
 * uploading, or no database connected). `limit` is the size of the server list when it's a top-N,
 * so older local sessions that fell off it on purpose aren't added back.
 */
export function mergeSessions(
  server: SessionSummary[] | null,
  local: Session[],
  byId: Map<string, Question>,
  limit?: number,
): SessionSummary[] {
  const out = [...(server ?? [])];
  const known = new Set(out.map((s) => s.id));
  const cutoff = limit && server && server.length >= limit ? server[server.length - 1].finishedAt : 0;
  for (const s of local) {
    if (!s.finishedAt || known.has(s.id) || s.finishedAt < cutoff) continue;
    out.push(summarizeSession(s, byId));
  }
  out.sort((a, b) => b.finishedAt - a.finishedAt);
  return limit ? out.slice(0, limit) : out;
}
