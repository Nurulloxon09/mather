import type { Question } from "@/lib/types";
import { advancedMath } from "./math-hard-book/advanced-math";
import { algebra } from "./math-hard-book/algebra";

/** Built-in question bank (Phase 1). Later phases load questions from the database. */
export const QUESTIONS: Question[] = [...algebra, ...advancedMath];
