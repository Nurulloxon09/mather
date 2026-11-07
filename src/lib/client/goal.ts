import { cleanGoal, type Goal } from "../plan";
import { api } from "./api";

// The score goal lives in the database (shared across devices) with a copy in this browser,
// so it shows without a database and survives being offline. The newer copy wins.

const KEY = "mather:goal";

export function localGoal(): Goal | null {
  try {
    return cleanGoal(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return null;
  }
}

export function newerGoal(a: Goal | null, b: Goal | null) {
  if (!a) return b;
  if (!b) return a;
  return b.updatedAt > a.updatedAt ? b : a;
}

export async function storeGoal(goal: Goal) {
  try {
    localStorage.setItem(KEY, JSON.stringify(goal));
  } catch {
    // storage blocked; the database copy still holds it
  }
  try {
    await api.saveGoal(goal);
  } catch {
    // offline or no database: this browser's copy is enough
  }
}
