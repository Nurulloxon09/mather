// Checks the built-in question bank: answer formats, figures on disk, and
// that every LaTeX snippet renders without a KaTeX error.
import { existsSync } from "node:fs";
import path from "node:path";
import { QUESTIONS } from "../src/data/questions";
import { isAllowedPartial, isGridCorrect, parseValue } from "../src/lib/grid";
import { parseBlocks } from "../src/lib/rich";
import { SKILLS } from "../src/lib/types";

const problems: string[] = [];
const seen = new Set<string>();

function checkText(id: string, field: string, src: string) {
  for (const b of parseBlocks(src)) {
    const html = b.t === "table" || b.t === "ul" ? JSON.stringify(b) : b.t === "img" ? "" : b.html;
    if (html.includes("katex-error")) problems.push(`${id} ${field}: KaTeX error`);
    if (b.t === "img" && !existsSync(path.join("public", b.src))) problems.push(`${id} ${field}: missing ${b.src}`);
  }
  if (/\$\{/.test(src)) problems.push(`${id} ${field}: stray template interpolation`);
  const dollars = src.replace(/\\\$/g, "").match(/\$/g)?.length ?? 0;
  if (dollars % 2) problems.push(`${id} ${field}: unbalanced $`);
}

for (const q of QUESTIONS) {
  if (seen.has(q.id)) problems.push(`${q.id}: duplicate id`);
  seen.add(q.id);
  if (!SKILLS[q.domain].includes(q.skill)) problems.push(`${q.id}: skill "${q.skill}" not in ${q.domain}`);
  checkText(q.id, "stem", q.stem);
  checkText(q.id, "explanation", q.explanation);
  if (q.flag) checkText(q.id, "flag", q.flag);
  if (q.type === "mcq") {
    if (q.choices?.length !== 4) problems.push(`${q.id}: needs 4 choices`);
    if (!q.answer) problems.push(`${q.id}: missing answer`);
    q.choices?.forEach((c, i) => checkText(q.id, `choice ${i}`, c));
  } else {
    if (!q.gridAnswers?.length) problems.push(`${q.id}: missing grid answers`);
    for (const a of q.gridAnswers ?? []) {
      const v = parseValue(a);
      if (!v) {
        problems.push(`${q.id}: bad grid answer ${a}`);
        continue;
      }
      // Some form of the answer has to fit in the answer box and be graded correct.
      const dec = Number(v.n) / Number(v.d);
      const candidates = [a, String(dec), ...[1, 2, 3, 4, 5].flatMap((p) => [dec.toFixed(p), dec.toFixed(p).replace(/^(-?)0\./, "$1.")])];
      if (!candidates.some((c) => isAllowedPartial(c) && isGridCorrect(c, q.gridAnswers!)))
        problems.push(`${q.id}: no enterable form of ${a}`);
    }
  }
}

const by = (k: (q: (typeof QUESTIONS)[number]) => string) =>
  QUESTIONS.reduce<Record<string, number>>((acc, q) => ((acc[k(q)] = (acc[k(q)] ?? 0) + 1), acc), {});
console.log(`${QUESTIONS.length} questions`, by((q) => q.domain), by((q) => q.type), `flagged: ${QUESTIONS.filter((q) => q.flag).length}`);
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("data ok");
