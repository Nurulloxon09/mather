import type { ChoiceLetter, Difficulty, Domain, Question } from "@/lib/types";

/** Compact authoring shape for a book's questions. */
export type Draft = {
  n: number;
  skill: string;
  page: number;
  stem: string;
  choices?: string[];
  answer?: ChoiceLetter;
  grid?: string[];
  explanation: string;
  difficulty?: Difficulty;
  flag?: string;
};

export function defineChapter(opts: {
  source: string;
  prefix: string;
  domain: Domain;
  difficulty: Difficulty;
  questions: Draft[];
}): Question[] {
  return opts.questions.map((d) => ({
    id: `${opts.prefix}-${d.n}`,
    source: opts.source,
    sourceNumber: d.n,
    domain: opts.domain,
    skill: d.skill,
    difficulty: d.difficulty ?? opts.difficulty,
    type: d.grid ? "spr" : "mcq",
    stem: d.stem.trim(),
    choices: d.choices?.map((c) => c.trim()),
    answer: d.answer,
    gridAnswers: d.grid,
    explanation: d.explanation.trim(),
    page: d.page,
    flag: d.flag,
  }));
}
