import type { Question } from "@/lib/types";
import { advancedMath } from "./math-hard-book/advanced-math";
import { algebra } from "./math-hard-book/algebra";
import { problemSolving } from "./math-hard-book/problem-solving";

/** Built-in question bank (Phase 1). Later phases load questions from the database. */
export const QUESTIONS: Question[] = [...algebra, ...advancedMath, ...problemSolving];
