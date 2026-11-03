// Score estimate curves and progress statistics.
import assert from "node:assert/strict";
import type { SessionSummary } from "../src/lib/history";
import { estimateScore } from "../src/lib/score";
import { computeStats, MIN_TO_RANK, PACE_MS, periodStart, startOfDay, startOfWeek, type AttemptRow, type QMeta } from "../src/lib/stats";

// ---- Score estimate ----
assert.equal(estimateScore(44, 44).score, 800);
assert.equal(estimateScore(0, 44).score, 200);
assert.equal(estimateScore(44, 44, "easier").score, 650, "easier Module 2 caps the score");
assert.equal(estimateScore(44, 44, "harder").score, 800);
assert.ok(estimateScore(30, 44, "harder").score > estimateScore(30, 44, "easier").score, "harder route scores higher for the same raw");
for (const route of [undefined, "harder", "easier"] as const) {
  let prev = 0;
  for (let raw = 0; raw <= 44; raw++) {
    const e = estimateScore(raw, 44, route);
    assert.ok(e.score >= prev, `monotonic at ${raw} (${route})`);
    assert.ok(e.score % 10 === 0 && e.low <= e.score && e.high >= e.score && e.low >= 200 && e.high <= 800);
    prev = e.score;
  }
}
assert.equal(estimateScore(11, 22).score, estimateScore(22, 44).score, "scaled to 44 questions");

// ---- Stats ----
const meta: Record<string, QMeta> = {
  a1: { domain: "Algebra", skill: "Linear functions", difficulty: "Hard", number: 1, source: "B" },
  a2: { domain: "Algebra", skill: "Linear functions", difficulty: "Hard", number: 2, source: "B" },
  a3: { domain: "Algebra", skill: "Linear equations in one variable", difficulty: "Easy", number: 3, source: "B" },
  m1: { domain: "Advanced Math", skill: "Equivalent expressions", difficulty: "Medium", number: 4, source: "B" },
};
const now = new Date(2026, 10, 4, 15, 0).getTime(); // Wed 4 Nov 2026, 15:00 local
const daysAgo = (n: number, h = 10) => new Date(2026, 10, 4 - n, h).getTime();
const rows: AttemptRow[] = [
  ["a1", "s1", 0, 60_000, daysAgo(40), 0],
  ["a1", "s2", 1, 120_000, daysAgo(2), 1],
  ["a2", "s2", 0, 200_000, daysAgo(2), 1],
  ["a2", "s3", 0, 30_000, daysAgo(1), 0],
  ["a3", "s3", 1, 20_000, daysAgo(1), 0],
  ["m1", "s4", 1, 50_000, daysAgo(0), 0],
  ["gone", "s4", 1, 50_000, daysAgo(0), 0], // question no longer in the bank
];
const sessions: SessionSummary[] = [
  { id: "x1", mode: "exam", kind: "exam", title: "Full exam", finishedAt: daysAgo(2), correct: 30, total: 44, timeMs: 1, estimate: estimateScore(30, 44) },
  { id: "x0", mode: "exam", kind: "exam", title: "Full exam", finishedAt: daysAgo(45), correct: 20, total: 44, timeMs: 1 },
  { id: "t1", mode: "exam", kind: "timed", title: "Timed set: A", finishedAt: daysAgo(1), correct: 2, total: 3, timeMs: 1 },
];

const all = computeStats(rows, meta, sessions, { period: "all", now, bankSize: 10 });
assert.equal(all.answered, 6, "unknown questions are left out");
assert.equal(all.correct, 3);
assert.equal(all.overPace, rows.filter((r) => r[3] > PACE_MS && meta[r[0]]).length);
assert.equal(all.notTried, 6, "10 in bank, 4 tried");
assert.equal(all.daysPracticed, 4);
assert.equal(all.streak, 3, "today, yesterday and the day before");
assert.deepEqual(all.byDomain.map((g) => [g.key, g.n]), [["Algebra", 5], ["Advanced Math", 1]]);
assert.deepEqual(all.byMode.map((g) => [g.key, g.n, g.correct]), [["Practice", 4, 2], ["Tests", 2, 1]]);
const lf = all.bySkill.find((g) => g.key === "Linear functions")!;
assert.equal(lf.n, 4);
assert.equal(lf.accuracy, 0.25);
assert.deepEqual(all.weakest.map((g) => g.key), ["Linear functions"], `only skills with ${MIN_TO_RANK}+ answers are ranked`);
assert.equal(all.bucket, "week");
assert.equal(all.buckets[0].start, startOfWeek(daysAgo(40)));
assert.equal(all.buckets.at(-1)!.start, startOfWeek(now));
assert.equal(all.buckets.reduce((s, b) => s + b.answered, 0), 6);
assert.deepEqual(all.exams.map((e) => e.id), ["x0", "x1"], "full exams only, oldest first");
assert.equal(all.slowest[0].timeMs, 200_000);

const week = computeStats(rows, meta, sessions, { period: "7d", now, bankSize: 10 });
assert.equal(week.answered, 5, "the 40-day-old attempt is outside 7 days");
assert.equal(week.bucket, "day");
assert.equal(week.buckets.length, 7);
assert.equal(week.buckets[0].start, periodStart("7d", now));
assert.equal(week.buckets.at(-1)!.start, startOfDay(now));
assert.equal(week.streak, 3, "streak ignores the period");
assert.deepEqual(week.exams.map((e) => e.id), ["x1"]);
assert.equal(computeStats(rows, meta, sessions, { period: "30d", now, bankSize: 10 }).buckets.length, 30);

const empty = computeStats([], meta, [], { period: "all", now, bankSize: 10 });
assert.equal(empty.answered, 0);
assert.equal(empty.buckets.length, 1);
assert.equal(empty.streak, 0);

console.log("stats tests passed");
