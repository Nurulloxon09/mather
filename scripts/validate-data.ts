// Checks the built-in question bank: answer formats, figures on disk, and
// that every LaTeX snippet renders without a KaTeX error.
import { existsSync } from "node:fs";
import path from "node:path";
import { QUESTIONS } from "../src/data/questions";
import { parseBlocks } from "../src/lib/rich";
import { questionProblems } from "../src/lib/validate";

const problems: string[] = [];
const seen = new Set<string>();

for (const q of QUESTIONS) {
  if (seen.has(q.id)) problems.push(`${q.id}: duplicate id`);
  seen.add(q.id);
  for (const p of questionProblems(q)) problems.push(`${q.id}: ${p}`);
  for (const src of [q.stem, q.explanation, ...(q.choices ?? [])]) {
    for (const b of parseBlocks(src)) {
      if (b.t === "img" && !existsSync(path.join("public", b.src))) problems.push(`${q.id}: missing ${b.src}`);
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
