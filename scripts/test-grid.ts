import assert from "node:assert/strict";
import { isGridCorrect, isAllowedPartial } from "../src/lib/grid";

const ok = (e: string, a: string[]) => assert.equal(isGridCorrect(e, a), true, `${e} should match ${a}`);
const no = (e: string, a: string[]) => assert.equal(isGridCorrect(e, a), false, `${e} should NOT match ${a}`);

// Examples from the SAT student-produced response directions
for (const e of ["3.5", "3.50", "7/2"]) ok(e, ["7/2"]);
for (const e of ["2/3", ".6666", ".6667", "0.666", "0.667"]) ok(e, ["2/3"]);
for (const e of ["0.66", ".66", "0.67", ".67"]) no(e, ["2/3"]);
for (const e of ["-1/3", "-.3333", "-0.333"]) ok(e, ["-1/3"]);
for (const e of ["-.33", "-0.33"]) no(e, ["-1/3"]);
// equivalents
for (const e of ["3/4", ".75", "0.75", "6/8", "0.750"]) ok(e, ["3/4"]);
ok("-28.16", ["-169/6"]); ok("-28.17", ["-169/6"]); ok("-169/6", ["-169/6"]); no("-28.1", ["-169/6"]);
ok("1.184", ["77/65"]); ok("1.185", ["77/65"]); no("1.18", ["77/65"]);
ok("0.78", ["0.78"]); ok(".78", ["0.78"]); ok("39/50", ["0.78"]);
// multiple answers
ok("5", ["-3", "5"]); ok("-3", ["-3", "5"]); no("3", ["-3", "5"]);
// input rules
assert.equal(isAllowedPartial("12345"), true);
assert.equal(isAllowedPartial("123456"), false);
assert.equal(isAllowedPartial("-12345"), true);
assert.equal(isAllowedPartial("1.2.3"), false);
assert.equal(isAllowedPartial("1/2/"), false);
assert.equal(isAllowedPartial("1-2"), false);
assert.equal(isAllowedPartial("1.5/2"), false);
assert.equal(isAllowedPartial("/2"), false);
console.log("grid tests passed");
