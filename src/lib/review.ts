import type { Attempt, ProgressMap } from "./attempts";
import { startOfDay } from "./stats";

/**
 * Spaced review of missed questions. A miss brings the question back 1 day later; each right
 * answer on or after its review day pushes it out to the next gap (3 days, then 7). Right on the
 * 7-day review and it's cleared. A miss at any point starts over at 1 day. Right answers before
 * the review day (say, redoing a set straight after the results) don't move it along: the
 * answer was still fresh.
 */
export const REVIEW_DAYS = [1, 3, 7] as const;

export type ReviewState = {
  /** Which gap the question is waiting out: 0 → 1 day, 1 → 3 days, 2 → 7 days. */
  step: number;
  /** Local midnight of the day it's due. */
  due: number;
};

/** Local midnight `n` days after the day containing `ms` (DST-safe). */
export function addDays(ms: number, n: number) {
  const d = new Date(startOfDay(ms));
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime();
}

/** Where a question stands, from its attempts (any order). Null: never missed, or cleared. */
export function reviewState(attempts: Attempt[]): ReviewState | null {
  let st: ReviewState | null = null;
  for (const a of [...attempts].sort((x, y) => x.createdAt - y.createdAt)) {
    if (!a.correct) st = { step: 0, due: addDays(a.createdAt, REVIEW_DAYS[0]) };
    else if (st && a.createdAt >= st.due) {
      const step: number = st.step + 1;
      st = step >= REVIEW_DAYS.length ? null : { step, due: addDays(a.createdAt, REVIEW_DAYS[step]) };
    }
  }
  return st;
}

export type ReviewQueue = {
  /** Question ids due today or overdue, most overdue first. */
  due: string[];
  /** Everything waiting for a review, due or not. */
  waiting: number;
  /** The next day something comes due (after today), and how many. */
  next: { day: number; count: number } | null;
};

export function reviewQueue(progress: ProgressMap, now: number, exists: (id: string) => boolean = () => true): ReviewQueue {
  const today = startOfDay(now);
  const due: { id: string; at: number }[] = [];
  const later = new Map<number, number>();
  let waiting = 0;
  for (const [id, p] of Object.entries(progress)) {
    if (!exists(id)) continue;
    const st = reviewState(p.history);
    if (!st) continue;
    waiting++;
    if (st.due <= today) due.push({ id, at: st.due });
    else later.set(st.due, (later.get(st.due) ?? 0) + 1);
  }
  due.sort((a, b) => a.at - b.at);
  const nextDay = [...later.keys()].sort((a, b) => a - b)[0];
  return {
    due: due.map((d) => d.id),
    waiting,
    next: nextDay === undefined ? null : { day: nextDay, count: later.get(nextDay)! },
  };
}
