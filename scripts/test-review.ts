// Checks the spaced review of missed questions and the home-page plan helpers.
import assert from "node:assert/strict";
import type { Attempt } from "../src/lib/attempts";
import { addAttempts } from "../src/lib/attempts";
import { answeredToday, cleanGoal, daysUntil, suggestSkills } from "../src/lib/plan";
import { addDays, reviewQueue, reviewState } from "../src/lib/review";
import { startOfDay } from "../src/lib/stats";
import { QUESTIONS } from "../src/data/questions";

const day0 = new Date(2026, 9, 5, 15, 30).getTime(); // a Monday afternoon, local time
const at = (days: number, hour = 15) => {
  const d = new Date(day0);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, hour).getTime();
};
let n = 0;
const att = (qid: string, correct: boolean, createdAt: number): Attempt => ({
  id: `s${++n}:${qid}`,
  sessionId: `s${n}`,
  questionId: qid,
  mode: "practice",
  answer: "A",
  correct,
  timeMs: 1000,
  marked: false,
  createdAt,
});

// Never missed: not in review.
assert.equal(reviewState([att("q", true, at(0))]), null);

// A miss is due the next day.
let st = reviewState([att("q", false, at(0))]);
assert.deepEqual(st, { step: 0, due: startOfDay(at(1)) });

// Right again the same day (answer still fresh): no change.
st = reviewState([att("q", false, at(0)), att("q", true, at(0, 18))]);
assert.deepEqual(st, { step: 0, due: startOfDay(at(1)) });

// Right on the review day: next gap is 3 days, then 7, then cleared.
const right1 = att("q", true, at(1, 9));
st = reviewState([att("q", false, at(0)), right1]);
assert.deepEqual(st, { step: 1, due: addDays(at(1), 3) });
const right2 = att("q", true, at(4, 9));
st = reviewState([att("q", false, at(0)), right1, right2]);
assert.deepEqual(st, { step: 2, due: addDays(at(4), 7) });
assert.equal(reviewState([att("q", false, at(0)), right1, right2, att("q", true, at(11))]), null);

// Late reviews count (overdue is fine); a miss mid-way starts over.
st = reviewState([att("q", false, at(0)), att("q", true, at(6)), att("q", false, at(9))]);
assert.deepEqual(st, { step: 0, due: startOfDay(at(10)) });

// Order of the attempts doesn't matter.
st = reviewState([right2, right1, att("q", false, at(0))]);
assert.equal(st?.step, 2);

// The queue: due (most overdue first), later, and the next day something comes due.
const progress = addAttempts({}, [
  att("a", false, at(0)), // due day 1
  att("b", false, at(-3)), // due day -2 (overdue)
  att("c", false, at(2)), // due day 3
  att("d", false, at(2)), // due day 3
  att("e", true, at(0)), // never missed
  att("gone", false, at(-5)), // not in the bank any more
]);
const qq = reviewQueue(progress, at(1, 8), (id) => id !== "gone");
assert.deepEqual(qq.due, ["b", "a"]);
assert.equal(qq.waiting, 4);
assert.deepEqual(qq.next, { day: startOfDay(at(3)), count: 2 });
assert.deepEqual(reviewQueue({}, at(0)), { due: [], waiting: 0, next: null });

// Days until test day, counted in local days.
assert.equal(daysUntil("", day0), null);
const td = new Date(at(10));
const iso = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, "0")}-${String(td.getDate()).padStart(2, "0")}`;
assert.equal(daysUntil(iso, day0), 10);
assert.equal(daysUntil(iso, at(10, 23)), 0);

// Goals are checked and rounded.
assert.deepEqual(cleanGoal({ target: 694, testDate: "2026-12-05", daily: 25.4, updatedAt: 5 }), {
  target: 690,
  testDate: "2026-12-05",
  daily: 25,
  updatedAt: 5,
});
assert.equal(cleanGoal({ target: 900, testDate: "", daily: 20 }), null);
assert.equal(cleanGoal({ target: 700, testDate: "tomorrow", daily: 20 }), null);
assert.equal(cleanGoal(null), null);

// Answered today counts every attempt since local midnight.
assert.equal(answeredToday(progress, at(2, 20)), 2);

// Skill suggestions: lowest accuracy first (with enough answers), then untried skills.
const bank = QUESTIONS.filter((q) => !q.flag);
const skillA = bank[0].skill;
const inA = bank.filter((q) => q.skill === skillA).slice(0, 3);
const skillB = bank.find((q) => q.skill !== skillA)!.skill;
const inB = bank.filter((q) => q.skill === skillB).slice(0, 3);
const p2 = addAttempts({}, [
  ...inA.map((q, i) => att(q.id, i === 0, at(0))), // 1/3
  ...inB.map((q) => att(q.id, true, at(0))), // 3/3, nothing left to get right only if every B question is done
]);
const picks = suggestSkills(bank, p2, 2);
assert.equal(picks[0].skill, skillA);
assert.equal(Math.round(picks[0].accuracy! * 100), 33);
assert.ok(picks.length === 2);

console.log("review tests passed");
