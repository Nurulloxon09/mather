// Checks how attempts are derived from sessions and folded into per-question progress.
import assert from "node:assert/strict";
import { addAttempts, attemptsForSession, grade, hasStatus, HISTORY_LIMIT } from "../src/lib/attempts";
import { newModule, newPracticeSession, newTimedSession, type ExamSession } from "../src/lib/session";
import { QUESTIONS } from "../src/data/questions";

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
const mcq = QUESTIONS.find((q) => q.type === "mcq" && !q.flag)!;
const spr = QUESTIONS.find((q) => q.type === "spr" && !q.flag)!;
const other = QUESTIONS.find((q) => q.id !== mcq.id && q.id !== spr.id)!;
const wrongLetter = (["A", "B", "C", "D"] as const).find((l) => l !== mcq.answer)!;

// Practice: checked items keep their check time, answered-unchecked use the finish time, blanks are skipped.
const p = newPracticeSession("t", [mcq.id, spr.id, other.id]);
p.module.items[mcq.id] = { answer: mcq.answer, timeMs: 12_000, checked: true, checkedAt: 1_000 };
p.module.items[spr.id] = { answer: spr.gridAnswers![0], timeMs: 30_000, marked: true };
p.finishedAt = 5_000;
const pa = attemptsForSession(p);
assert.equal(pa.length, 2);
assert.equal(pa[0].id, `${p.id}:${mcq.id}`);
assert.equal(pa[0].createdAt, 1_000);
assert.equal(pa[1].createdAt, 5_000);
assert.equal(pa[1].marked, true);
assert.ok(pa.every((a) => a.mode === "practice"));

// Unfinished practice: only checked items count.
const p2 = { ...p, finishedAt: undefined };
assert.equal(attemptsForSession(p2).length, 1);

// Exam: every question in a submitted module, blanks included; unsubmitted modules don't count.
const e: ExamSession = {
  ...newTimedSession("x", [mcq.id, spr.id]),
  modules: [{ ...newModule([mcq.id, spr.id]), submittedAt: 9_000 }, newModule([other.id])],
};
e.modules[0].items[mcq.id] = { answer: wrongLetter, timeMs: 1 };
const ea = attemptsForSession(e);
assert.equal(ea.length, 2);
assert.equal(ea[1].answer, null);
assert.ok(ea.every((a) => a.createdAt === 9_000 && a.mode === "exam"));

// Grading.
const g = ea.map((a) => grade(a, byId.get(a.questionId)!));
assert.deepEqual(
  g.map((a) => a.correct),
  [false, false],
);
assert.equal(grade(pa[0], mcq).correct, true);
assert.equal(grade(pa[1], spr).correct, true);

// Progress: latest attempt decides status; repeats by id replace instead of double counting.
const first = { ...grade(pa[0], mcq), createdAt: 1 };
const later = { ...g[0], id: "s2:" + mcq.id, createdAt: 2 };
let prog = addAttempts({}, [later, first]);
assert.equal(prog[mcq.id].n, 2);
assert.equal(prog[mcq.id].nCorrect, 1);
assert.equal(prog[mcq.id].last.id, later.id);
assert.ok(hasStatus(prog[mcq.id], "incorrect"));
assert.ok(!hasStatus(prog[mcq.id], "correct"));
assert.ok(hasStatus(prog[spr.id], "unanswered"));

prog = addAttempts(prog, [{ ...later, marked: true, correct: true }]);
assert.equal(prog[mcq.id].n, 2);
assert.equal(prog[mcq.id].nCorrect, 2);
assert.ok(hasStatus(prog[mcq.id], "marked"));

// History is capped, counts are not.
const many = Array.from({ length: 15 }, (_, i) => ({ ...first, id: `m${i}:${mcq.id}`, createdAt: 100 + i }));
const capped = addAttempts({}, many);
assert.equal(capped[mcq.id].n, 15);
assert.equal(capped[mcq.id].history.length, HISTORY_LIMIT);
assert.equal(capped[mcq.id].last.createdAt, 114);

console.log("progress tests passed");
