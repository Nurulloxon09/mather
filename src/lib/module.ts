import type { ModuleState } from "./session";
import type { ChoiceLetter, ItemState } from "./types";

// Pure updates on a module's state, shared by the exam and practice runners.

export function patchItem(m: ModuleState, id: string, patch: Partial<ItemState>): ModuleState {
  return { ...m, items: { ...m.items, [id]: { ...(m.items[id] ?? { timeMs: 0 }), ...patch } } };
}

export function currentId(m: ModuleState) {
  return m.questionIds[m.index];
}

export function setAnswer(m: ModuleState, answer: string | undefined): ModuleState {
  const id = currentId(m);
  const item = m.items[id];
  // Choosing an option that was crossed out un-crosses it.
  const crossed = (item?.crossed ?? []).filter((l) => l !== answer);
  return patchItem(m, id, { answer, crossed });
}

export function toggleMark(m: ModuleState): ModuleState {
  const id = currentId(m);
  return patchItem(m, id, { marked: !m.items[id]?.marked });
}

export function toggleCross(m: ModuleState, letter: ChoiceLetter): ModuleState {
  const id = currentId(m);
  const item = m.items[id];
  const crossed = item?.crossed ?? [];
  if (crossed.includes(letter)) {
    return patchItem(m, id, { crossed: crossed.filter((l) => l !== letter) });
  }
  // Crossing out the selected option clears the selection.
  return patchItem(m, id, {
    crossed: [...crossed, letter],
    answer: item?.answer === letter ? undefined : item?.answer,
  });
}

export function goTo(m: ModuleState, index: number): ModuleState {
  return { ...m, index: Math.max(0, Math.min(index, m.questionIds.length - 1)), onReview: false };
}

/** Add elapsed time to the question on screen. */
export function addTime(m: ModuleState, ms: number): ModuleState {
  if (m.onReview) return m;
  const id = currentId(m);
  if (m.items[id]?.checked) return m;
  return patchItem(m, id, { timeMs: (m.items[id]?.timeMs ?? 0) + ms });
}

export function gridCells(m: ModuleState) {
  return m.questionIds.map((id) => ({
    answered: !!m.items[id]?.answer,
    marked: !!m.items[id]?.marked,
  }));
}
