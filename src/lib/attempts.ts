import { isCorrect, type ModuleState, type Session } from "./session";
import type { Question } from "./types";

/** One answer to one question, as saved to the database. */
export type Attempt = {
  /** `${sessionId}:${questionId}`; a question appears at most once per session. */
  id: string;
  sessionId: string;
  questionId: string;
  mode: Session["mode"];
  answer: string | null;
  correct: boolean;
  timeMs: number;
  marked: boolean;
  createdAt: number;
};

/** What the browser sends; the server works out `correct` itself. */
export type AttemptInput = Omit<Attempt, "correct">;

export function attemptFor(session: Session, m: ModuleState, questionId: string, createdAt: number): AttemptInput {
  const it = m.items[questionId];
  return {
    id: `${session.id}:${questionId}`,
    sessionId: session.id,
    questionId,
    mode: session.mode,
    answer: it?.answer || null,
    timeMs: Math.round(it?.timeMs ?? 0),
    marked: !!it?.marked,
    createdAt,
  };
}

/**
 * Every attempt a session has produced so far.
 * Exam: every question in a submitted module (blank answers count as wrong).
 * Practice: every answered question; checked ones keep the time they were checked.
 */
export function attemptsForSession(session: Session): AttemptInput[] {
  if (session.mode === "exam") {
    return session.modules.flatMap((m) =>
      m.submittedAt ? m.questionIds.map((id) => attemptFor(session, m, id, m.submittedAt!)) : [],
    );
  }
  const m = session.module;
  const fallback = session.finishedAt;
  return m.questionIds.flatMap((id) => {
    const it = m.items[id];
    const at = it?.checkedAt ?? (it?.answer ? fallback : undefined);
    return at ? [attemptFor(session, m, id, at)] : [];
  });
}

export function grade(input: AttemptInput, q: Question): Attempt {
  return { ...input, correct: isCorrect(q, input.answer ?? undefined) };
}

/** Per-question history used for bank statuses and the stats page. */
export type QuestionProgress = {
  n: number;
  nCorrect: number;
  last: Attempt;
  /** Most recent first, capped at HISTORY_LIMIT. */
  history: Attempt[];
};

export const HISTORY_LIMIT = 10;

export type ProgressMap = Record<string, QuestionProgress>;

/** Fold attempts (any order) into a progress map. Attempts already counted, by id, are skipped. */
export function addAttempts(base: ProgressMap, attempts: Attempt[]): ProgressMap {
  const out: ProgressMap = { ...base };
  for (const a of [...attempts].sort((x, y) => x.createdAt - y.createdAt)) {
    const p = out[a.questionId];
    if (!p) {
      out[a.questionId] = { n: 1, nCorrect: a.correct ? 1 : 0, last: a, history: [a] };
      continue;
    }
    const existing = p.history.findIndex((h) => h.id === a.id);
    if (existing !== -1) {
      // Same attempt seen again (e.g. a mark changed after syncing): replace it in place.
      const history = p.history.map((h, i) => (i === existing ? a : h));
      const delta = (a.correct ? 1 : 0) - (p.history[existing].correct ? 1 : 0);
      out[a.questionId] = { ...p, nCorrect: p.nCorrect + delta, history, last: history[0] };
      continue;
    }
    const history = [a, ...p.history].sort((x, y) => y.createdAt - x.createdAt).slice(0, HISTORY_LIMIT);
    out[a.questionId] = {
      n: p.n + 1,
      nCorrect: p.nCorrect + (a.correct ? 1 : 0),
      last: history[0],
      history,
    };
  }
  return out;
}

export type Status = "unanswered" | "correct" | "incorrect" | "marked";

export function hasStatus(p: QuestionProgress | undefined, s: Status) {
  switch (s) {
    case "unanswered":
      return !p;
    case "correct":
      return !!p && p.last.correct;
    case "incorrect":
      return !!p && !p.last.correct;
    case "marked":
      return !!p && p.last.marked;
  }
}
