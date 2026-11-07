import type { ProgressMap } from "./attempts";
import { startOfDay } from "./stats";
import type { Domain, Question } from "./types";

/** The student's target, set on the home page. */
export type Goal = {
  /** Target SAT Math score, 200–800 in steps of 10. */
  target: number;
  /** Test day as YYYY-MM-DD, or "" when not booked yet. */
  testDate: string;
  /** Questions to answer each day. */
  daily: number;
  updatedAt: number;
};

export const DEFAULT_DAILY = 20;

const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

/** A goal from storage or a request, or null when it isn't one. */
export function cleanGoal(v: unknown): Goal | null {
  if (!v || typeof v !== "object") return null;
  const g = v as Record<string, unknown>;
  const target = Number(g.target);
  const daily = Number(g.daily);
  const updatedAt = Number(g.updatedAt);
  if (!Number.isFinite(target) || target < 200 || target > 800) return null;
  if (!Number.isFinite(daily) || daily < 1 || daily > 200) return null;
  if (g.testDate !== "" && !isDate(g.testDate)) return null;
  return {
    target: Math.round(target / 10) * 10,
    testDate: g.testDate as string,
    daily: Math.round(daily),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
  };
}

/** Whole days from today until test day (0 on the day itself), or null with no date. */
export function daysUntil(testDate: string, now: number): number | null {
  if (!isDate(testDate)) return null;
  const [y, m, d] = testDate.split("-").map(Number);
  const test = new Date(y, m - 1, d).getTime();
  return Math.round((test - startOfDay(now)) / 86_400_000);
}

/** Questions answered today (each attempt counts, so a redo counts again). */
export function answeredToday(progress: ProgressMap, now: number) {
  const today = startOfDay(now);
  let n = 0;
  for (const p of Object.values(progress)) for (const a of p.history) if (a.createdAt >= today) n++;
  return n;
}

export type SkillPick = { skill: string; domain: Domain; n: number; accuracy: number | null; left: number };

/**
 * Skills to work on today: the lowest accuracy among skills with at least `min` answers, then
 * skills not tried yet. `left` counts the questions still to get right (missed or unanswered).
 */
export function suggestSkills(bank: Question[], progress: ProgressMap, count = 2, min = 3): SkillPick[] {
  const by = new Map<string, SkillPick & { correct: number }>();
  for (const q of bank) {
    if (q.flag) continue;
    const s = by.get(q.skill) ?? { skill: q.skill, domain: q.domain, n: 0, correct: 0, accuracy: null, left: 0 };
    const p = progress[q.id];
    if (p) {
      for (const a of p.history) {
        s.n++;
        if (a.correct) s.correct++;
      }
    }
    if (!p || !p.last.correct) s.left++;
    by.set(q.skill, s);
  }
  const all = [...by.values()].filter((s) => s.left > 0).map((s) => ({ ...s, accuracy: s.n ? s.correct / s.n : null }));
  const ranked = all.filter((s) => s.n >= min).sort((a, b) => a.accuracy! - b.accuracy! || b.left - a.left);
  const untried = all.filter((s) => s.n === 0).sort((a, b) => b.left - a.left);
  return [...ranked, ...untried].slice(0, count).map(({ skill, domain, n, accuracy, left }) => ({ skill, domain, n, accuracy, left }));
}

/** The bank link the Stats page uses for "Practice": a skill's missed and unanswered questions. */
export function skillLink(skill: string) {
  return `/bank?skill=${encodeURIComponent(skill)}&status=incorrect&status=unanswered`;
}
