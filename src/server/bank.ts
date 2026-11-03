import "server-only";
import { QUESTIONS } from "@/data/questions";
import type { Question } from "@/lib/types";
import { getPublishedQuestions } from "./uploads";

/** Every question in the app: the built-in book questions plus published uploads. */
export async function getBank(): Promise<Question[]> {
  try {
    return [...QUESTIONS, ...(await getPublishedQuestions())];
  } catch (err) {
    // A database outage shouldn't take the built-in questions down with it.
    console.error("couldn't load uploaded questions", err);
    return QUESTIONS;
  }
}

export async function getBankById(): Promise<Map<string, Question>> {
  return new Map((await getBank()).map((q) => [q.id, q]));
}
