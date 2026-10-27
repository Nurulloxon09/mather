import "server-only";
import { QUESTIONS } from "@/data/questions";
import type { Question } from "@/lib/types";

// Every question the app knows about. Phase 3 adds published uploads from the database.
export async function getBank(): Promise<Question[]> {
  return QUESTIONS;
}

export async function getBankById(): Promise<Map<string, Question>> {
  return new Map((await getBank()).map((q) => [q.id, q]));
}
