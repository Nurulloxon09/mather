// Checks the keystroke-by-keystroke frames the Desmos walkthrough types.
import assert from "node:assert/strict";
import { isPoint, pointLabel, tokenize, typingFrames } from "../src/lib/desmos";

const norm = (s: string) => s.replace(/\s+/g, "");
const ends = (latex: string) => {
  const f = typingFrames(latex, 1000);
  assert.equal(norm(f[f.length - 1]), norm(latex), `last frame of ${latex}`);
  return f;
};
const balanced = (s: string) => {
  let d = 0;
  for (const c of s.replace(/\\[{}]/g, "")) {
    if (c === "{") d++;
    if (c === "}") d--;
    if (d < 0) return false;
  }
  return d === 0 && (s.match(/\\left/g) ?? []).length === (s.match(/\\right/g) ?? []).length;
};

assert.deepEqual(tokenize("y=2x+1"), ["y", "=", "2", "x", "+", "1"]);
assert.deepEqual(tokenize("\\frac{a}{b}"), ["\\frac", "{", "a", "}", "{", "b", "}"]);

// Plain typing, one character at a time.
assert.deepEqual(ends("y=2x+1"), ["y", "y=", "y=2", "y=2x", "y=2x+", "y=2x+1"]);

// A fraction appears empty first, then fills in, like typing "/" in Desmos.
const frac = ends("\\frac{26x}{7}");
assert.deepEqual(frac, ["\\frac{}{}", "\\frac{2}{}", "\\frac{26}{}", "\\frac{26x}{}", "\\frac{26x}{7}"]);

// Parentheses close themselves; powers get an empty box.
assert.deepEqual(ends("\\left(x+1\\right)^{2}"), [
  "\\left(\\right)",
  "\\left(x\\right)",
  "\\left(x+\\right)",
  "\\left(x+1\\right)",
  "\\left(x+1\\right)^{}",
  "\\left(x+1\\right)^{2}",
]);
assert.equal(typingFrames("x^2").at(-1), "x^{2}");

// Longer expressions: every frame is balanced, and the last is the expression itself.
for (const latex of [
  "y=\\frac{3}{4}\\left(\\frac{26x}{7}-800\\right)+15.50",
  "f(x)=\\sqrt[3]{2x^{n}+35}",
  "y_{1}\\sim mx_{1}+b",
  "\\operatorname{mean}\\left([1,2,3]\\right)",
  "y=\\left|x-3\\right|\\le5",
  "3.3\\cdot\\frac{4}{3}\\cdot\\frac{7}{26}",
]) {
  const f = ends(latex);
  assert.ok(f.every(balanced), `balanced frames for ${latex}`);
}
// \operatorname{mean} is typed as one piece, not letter by letter.
assert.ok(typingFrames("\\operatorname{mean}(L)").includes("\\operatorname{mean}"));
// A command followed by a letter keeps them apart.
assert.equal(typingFrames("2\\cdot x").at(-1), "2\\cdot x");

// Long expressions are thinned to at most `max` frames, keeping the last.
const long = "y=" + "1+".repeat(60) + "1";
const thin = typingFrames(long, 40);
assert.equal(thin.length, 40);
assert.equal(thin.at(-1), long);

assert.ok(isPoint("(4,7)"));
assert.ok(isPoint("\\left(-2.5, 3\\right)"));
assert.ok(!isPoint("y=2x"));
assert.equal(pointLabel("\\left(-2.5, 3\\right)"), "(-2.5, 3)");

console.log("desmos tests passed");
