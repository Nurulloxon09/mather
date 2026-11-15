import type { HighlightColor, TextHighlight } from "./types";

export const HIGHLIGHT_COLORS: {
  id: HighlightColor;
  label: string;
  swatch: string;
}[] = [
  { id: "yellow", label: "Yellow", swatch: "#fde047" },
  { id: "blue", label: "Blue", swatch: "#93c5fd" },
  { id: "pink", label: "Pink", swatch: "#f9a8d4" },
  { id: "green", label: "Green", swatch: "#86efac" },
];

/** Merge adjacent same-color highlights and keep the list sorted by start offset. */
function normalize(list: TextHighlight[]): TextHighlight[] {
  const sorted = [...list].filter((h) => h.end > h.start).sort((a, b) => a.start - b.start || a.end - b.end);
  const out: TextHighlight[] = [];
  for (const h of sorted) {
    const prev = out[out.length - 1];
    if (prev && prev.color === h.color && prev.end >= h.start) {
      prev.end = Math.max(prev.end, h.end);
    } else {
      out.push({ ...h });
    }
  }
  return out;
}

/** Subtract [start, end) from all highlights in the list, splitting any that span across it. */
export function removeHighlightRange(list: TextHighlight[], start: number, end: number): TextHighlight[] {
  if (end <= start) return list;
  const next: TextHighlight[] = [];
  for (const h of list) {
    if (h.end <= start || h.start >= end) {
      next.push(h);
      continue;
    }
    if (h.start < start) next.push({ ...h, end: start });
    if (h.end > end) next.push({ ...h, id: `${h.id}r`, start: end });
  }
  return normalize(next);
}

/** Apply a highlight color to [start, end), overriding any overlapping highlights cleanly. */
export function addHighlight(
  list: TextHighlight[],
  start: number,
  end: number,
  color: HighlightColor,
  id: string,
): TextHighlight[] {
  if (end <= start) return list;
  const trimmed = removeHighlightRange(list, start, end);
  return normalize([...trimmed, { id, start, end, color }]);
}

export function removeHighlightById(list: TextHighlight[], id: string): TextHighlight[] {
  return list.filter((h) => h.id !== id);
}

export function recolorHighlightById(list: TextHighlight[], id: string, color: HighlightColor): TextHighlight[] {
  return normalize(list.map((h) => (h.id === id ? { ...h, color } : h)));
}

export function overlapsHighlight(list: TextHighlight[], start: number, end: number): boolean {
  return list.some((h) => h.start < end && h.end > start);
}
