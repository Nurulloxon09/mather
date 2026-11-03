import type { SessionSummary } from "./history";
import { MODULE_SECONDS, MODULE_SIZE } from "./session";
import { DIFFICULTIES, DOMAINS, SKILLS, type Difficulty, type Domain } from "./types";

// Progress statistics, computed in the browser so days and weeks follow the viewer's time zone.

/** [questionId, sessionId, correct, timeMs, createdAt, isTest]. Tests are full exams and timed sets. */
export type AttemptRow = [string, string, 0 | 1, number, number, 0 | 1];

export type QMeta = { domain: Domain; skill: string; difficulty: Difficulty; number: number; source: string };

export type Period = "all" | "30d" | "7d";

/** Real-test pace: 35 minutes for 22 questions, about 95 seconds each. */
export const PACE_MS = (MODULE_SECONDS / MODULE_SIZE) * 1000;

/** Skills need this many answers before they're ranked, so one miss doesn't top the list. */
export const MIN_TO_RANK = 3;

export type Group = { key: string; n: number; correct: number; accuracy: number; avgTimeMs: number };
export type SkillGroup = Group & { domain: Domain };
export type Bucket = { start: number; answered: number; correct: number };
export type SlowAttempt = { questionId: string; sessionId: string; timeMs: number; correct: boolean; at: number };

export type Stats = {
  answered: number;
  correct: number;
  accuracy: number;
  avgTimeMs: number;
  overPace: number;
  daysPracticed: number;
  streak: number;
  /** Bank questions never answered (all time). */
  notTried: number;
  byDomain: Group[];
  bySkill: SkillGroup[];
  weakest: SkillGroup[];
  byDifficulty: Group[];
  byMode: Group[];
  bucket: "day" | "week";
  buckets: Bucket[];
  /** True when older weeks were left off the chart. */
  truncated: boolean;
  slowest: SlowAttempt[];
  exams: SessionSummary[];
};

const DAY = 86_400_000;
const MAX_WEEKS = 26;

export function startOfDay(ms: number) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Monday 00:00 of the week containing `ms`, local time. */
export function startOfWeek(ms: number) {
  const d = new Date(startOfDay(ms));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** Next local midnight; DST-safe (days aren't always 24h). */
const nextDay = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
};
const nextWeek = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7).getTime();
};

export function periodStart(period: Period, now: number) {
  if (period === "all") return 0;
  const days = period === "7d" ? 7 : 30;
  const d = new Date(startOfDay(now));
  d.setDate(d.getDate() - (days - 1));
  return d.getTime();
}

function group(key: string, rows: AttemptRow[]): Group {
  const n = rows.length;
  const correct = rows.reduce((s, r) => s + r[2], 0);
  return {
    key,
    n,
    correct,
    accuracy: n ? correct / n : 0,
    avgTimeMs: n ? rows.reduce((s, r) => s + r[3], 0) / n : 0,
  };
}

export function computeStats(
  all: AttemptRow[],
  meta: Record<string, QMeta>,
  sessions: SessionSummary[],
  opts: { period: Period; now: number; bankSize: number },
): Stats {
  const since = periodStart(opts.period, opts.now);
  // Attempts on questions that no longer exist can't be grouped; leave them out everywhere.
  const known = all.filter((r) => meta[r[0]]);
  const rows = known.filter((r) => r[4] >= since);

  const by = <K extends string>(keys: readonly K[], f: (m: QMeta) => string) =>
    keys.map((k) => group(k, rows.filter((r) => f(meta[r[0]]) === k))).filter((g) => g.n > 0);

  const bySkill: SkillGroup[] = DOMAINS.flatMap((domain) =>
    SKILLS[domain]
      .map((skill) => ({ ...group(skill, rows.filter((r) => meta[r[0]].skill === skill)), domain }))
      .filter((g) => g.n > 0),
  );
  const weakest = bySkill
    .filter((g) => g.n >= MIN_TO_RANK)
    .sort((a, b) => a.accuracy - b.accuracy || b.n - a.n)
    .slice(0, 5);

  const days = new Set(rows.map((r) => startOfDay(r[4])));
  const allDays = new Set(known.map((r) => startOfDay(r[4])));
  let streak = 0;
  const today = startOfDay(opts.now);
  // A streak still counts if today hasn't been practiced yet.
  let day = allDays.has(today) ? today : startOfDay(today - DAY / 2);
  while (allDays.has(day)) {
    streak++;
    day = startOfDay(day - DAY / 2);
  }

  // Columns: days for the 7- and 30-day views, weeks for all time.
  const bucket: Stats["bucket"] = opts.period === "all" ? "week" : "day";
  const step = bucket === "day" ? nextDay : nextWeek;
  const align = bucket === "day" ? startOfDay : startOfWeek;
  let first = opts.period === "all" ? (rows.length ? align(rows[0][4]) : align(opts.now)) : since;
  let truncated = false;
  if (bucket === "week") {
    const earliest = new Date(startOfWeek(opts.now));
    earliest.setDate(earliest.getDate() - 7 * (MAX_WEEKS - 1));
    if (first < earliest.getTime()) {
      first = earliest.getTime();
      truncated = true;
    }
  }
  const buckets: Bucket[] = [];
  for (let t = first; t <= opts.now; t = step(t)) buckets.push({ start: t, answered: 0, correct: 0 });
  for (const r of rows) {
    const t = align(r[4]);
    const b = buckets.find((x) => x.start === t);
    if (b) {
      b.answered++;
      b.correct += r[2];
    }
  }

  const answered = rows.length;
  const correct = rows.reduce((s, r) => s + r[2], 0);
  return {
    answered,
    correct,
    accuracy: answered ? correct / answered : 0,
    avgTimeMs: answered ? rows.reduce((s, r) => s + r[3], 0) / answered : 0,
    overPace: rows.filter((r) => r[3] > PACE_MS).length,
    daysPracticed: days.size,
    streak,
    notTried: Math.max(0, opts.bankSize - new Set(known.map((r) => r[0])).size),
    byDomain: by(DOMAINS, (m) => m.domain),
    bySkill,
    weakest,
    byDifficulty: by(DIFFICULTIES, (m) => m.difficulty),
    byMode: [group("Practice", rows.filter((r) => !r[5])), group("Tests", rows.filter((r) => r[5]))].filter((g) => g.n > 0),
    bucket,
    buckets,
    truncated,
    slowest: [...rows]
      .sort((a, b) => b[3] - a[3])
      .slice(0, 8)
      .filter((r) => r[3] > 0)
      .map((r) => ({ questionId: r[0], sessionId: r[1], timeMs: r[3], correct: r[2] === 1, at: r[4] })),
    exams: sessions.filter((s) => s.kind === "exam" && s.finishedAt >= since).sort((a, b) => a.finishedAt - b.finishedAt),
  };
}
