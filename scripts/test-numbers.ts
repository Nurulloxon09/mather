// Question-number ranges typed on the Practice page.
import assert from "node:assert/strict";
import { formatRanges, inRanges, parseNumberRanges } from "../src/lib/numbers";

const cases: [string, [number, number][] | null][] = [
  ["10-20", [[10, 20]]],
  ["34", [[34, 34]]],
  ["#34", [[34, 34]]],
  ["10 - 20", [[10, 20]]],
  ["10–20", [[10, 20]]],
  ["10 to 20", [[10, 20]]],
  ["20-10", [[10, 20]]],
  ["1-5, 12", [[1, 5], [12, 12]]],
  ["1-5 12 30-31", [[1, 5], [12, 12], [30, 31]]],
  ["  ", []],
  ["10-", null],
  ["abc", null],
  ["0", null],
  ["1-2-3", null],
];
for (const [input, want] of cases) assert.deepEqual(parseNumberRanges(input), want, input);

const r = parseNumberRanges("10-20, 34")!;
assert.ok(inRanges(10, r) && inRanges(20, r) && inRanges(34, r));
assert.ok(!inRanges(9, r) && !inRanges(21, r) && !inRanges(33, r));
assert.equal(formatRanges(parseNumberRanges("20 to 10 ,34")!), "10-20, 34");
console.log("number range tests passed");
