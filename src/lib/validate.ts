import { isAllowedPartial, isGridCorrect, parseValue } from "./grid";
import { parseBlocks } from "./rich";
import { LETTERS, SKILLS, type Question } from "./types";

// Checks a question is complete and renders cleanly. Used by the data tests for the
// built-in bank and before publishing an uploaded question.

const unescape = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

/** Problems in one markup field: LaTeX that doesn't render, unbalanced $, figures not cropped yet. */
export function textProblems(field: string, src: string): string[] {
  const out: string[] = [];
  for (const b of parseBlocks(src)) {
    const html = b.t === "table" || b.t === "ul" ? JSON.stringify(b) : b.t === "img" ? "" : b.html;
    const err = /katex-error[^>]*title=(?:\\?")([^"\\]*)/.exec(html);
    if (err) out.push(`${field}: ${unescape(err[1]).replace(/^ParseError: KaTeX parse error: /, "LaTeX error: ")}`);
    else if (html.includes("katex-error")) out.push(`${field}: LaTeX error`);
  }
  if (/\$\{/.test(src)) out.push(`${field}: stray template interpolation`);
  const dollars = src.replace(/\\\$/g, "").replace(/\$\$/g, "").match(/\$/g)?.length ?? 0;
  if (dollars % 2) out.push(`${field}: unbalanced $ (write \\$ for a dollar sign)`);
  if (/\[\[FIGURE[^\]]*\]\]/i.test(src)) out.push(`${field}: has a figure that hasn't been cropped yet`);
  return out;
}

/** Each accepted grid-in answer must parse, and some form of it must fit in the answer box. */
export function gridAnswerProblems(answers: string[]): string[] {
  const out: string[] = [];
  if (!answers.length) out.push("Grid-in needs at least one accepted answer");
  for (const a of answers) {
    const v = parseValue(a);
    if (!v) {
      out.push(`Answer "${a}" isn't a number or fraction`);
      continue;
    }
    const dec = Number(v.n) / Number(v.d);
    const candidates = [
      a,
      String(dec),
      ...[1, 2, 3, 4, 5].flatMap((p) => [dec.toFixed(p), dec.toFixed(p).replace(/^(-?)0\./, "$1.")]),
    ];
    if (!candidates.some((c) => isAllowedPartial(c) && isGridCorrect(c, answers))) {
      out.push(`Answer "${a}" has no form that fits in the answer box`);
    }
  }
  return out;
}

export function questionProblems(q: Question): string[] {
  const out: string[] = [];
  if (!q.stem.trim()) out.push("Question text is empty");
  if (!SKILLS[q.domain]?.includes(q.skill)) out.push(`Skill "${q.skill}" isn't part of ${q.domain}`);
  out.push(...textProblems("Question", q.stem), ...textProblems("Explanation", q.explanation));
  if (q.flag) out.push(...textProblems("Flag", q.flag));
  if (q.type === "mcq") {
    const choices = q.choices ?? [];
    if (choices.length !== 4 || choices.some((c) => !c.trim())) out.push("Multiple choice needs 4 answer choices");
    if (!q.answer || !LETTERS.includes(q.answer)) out.push("Pick the correct answer letter");
    choices.forEach((c, i) => out.push(...textProblems(`Choice ${LETTERS[i]}`, c)));
  } else {
    out.push(...gridAnswerProblems(q.gridAnswers ?? []));
  }
  return out;
}
