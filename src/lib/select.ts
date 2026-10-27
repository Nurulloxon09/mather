import { MODULE_SIZE } from "./session";
import { DIFFICULTIES, DOMAINS, type Difficulty, type Domain, type Question } from "./types";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type PracticeFilter = {
  domains: Domain[];
  difficulties: Difficulty[];
  types: Question["type"][];
  count: number;
};

export function filterQuestions(bank: Question[], f: Omit<PracticeFilter, "count">) {
  return bank.filter(
    (q) =>
      (!f.domains.length || f.domains.includes(q.domain)) &&
      (!f.difficulties.length || f.difficulties.includes(q.difficulty)) &&
      (!f.types.length || f.types.includes(q.type)),
  );
}

// Approximate Digital SAT content mix per module.
const DOMAIN_WEIGHT: Record<Domain, number> = {
  Algebra: 0.35,
  "Advanced Math": 0.35,
  "Problem-Solving and Data Analysis": 0.15,
  "Geometry and Trigonometry": 0.15,
};

type Route = "standard" | "harder" | "easier";

const DIFFICULTY_WEIGHT: Record<Route, Record<Difficulty, number>> = {
  standard: { Easy: 1, Medium: 1, Hard: 1 },
  harder: { Easy: 0.25, Medium: 1, Hard: 2 },
  easier: { Easy: 2, Medium: 1, Hard: 0.25 },
};

function weightedSample(pool: Question[], n: number, weight: (q: Question) => number) {
  // Efraimidis–Spirakis weighted sampling without replacement.
  return pool
    .map((q) => ({ q, k: Math.pow(Math.random(), 1 / Math.max(weight(q), 1e-6)) }))
    .sort((a, b) => b.k - a.k)
    .slice(0, n)
    .map((x) => x.q);
}

/**
 * Pick a module's questions: balanced across domains, weighted by difficulty
 * for the adaptive route, ordered easy → hard like the real test.
 */
export function buildModule(bank: Question[], route: Route, exclude: Set<string> = new Set()) {
  const pool = bank.filter((q) => !exclude.has(q.id));
  const weight = (q: Question) => DIFFICULTY_WEIGHT[route][q.difficulty];
  const available = DOMAINS.filter((d) => pool.some((q) => q.domain === d));
  const totalW = available.reduce((s, d) => s + DOMAIN_WEIGHT[d], 0);

  const picked: Question[] = [];
  for (const d of available) {
    const target = Math.round((DOMAIN_WEIGHT[d] / totalW) * MODULE_SIZE);
    picked.push(...weightedSample(pool.filter((q) => q.domain === d), target, weight));
  }
  const chosen = new Set(picked.map((q) => q.id));
  if (picked.length < MODULE_SIZE) {
    const rest = pool.filter((q) => !chosen.has(q.id));
    picked.push(...weightedSample(rest, MODULE_SIZE - picked.length, weight));
  }
  const final = shuffle(picked.slice(0, MODULE_SIZE));
  return final
    .sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty))
    .map((q) => q.id);
}

/** Route to the harder Module 2 at roughly 64% or better on Module 1. */
export function routeFor(correct: number, total: number): "harder" | "easier" {
  return total && correct / total >= 14 / 22 ? "harder" : "easier";
}
