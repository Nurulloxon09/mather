/**
 * Question-number ranges typed by hand: "10-20", "34", "1-5, 12", "10 to 20", "#7".
 * Returns the ranges, [] for empty input, or null if the text can't be read.
 */
export function parseNumberRanges(input: string): [number, number][] | null {
  const s = input
    .trim()
    .replace(/[–—]/g, "-")
    .replace(/\s+to\s+/gi, "-")
    .replace(/\s*-\s*/g, "-");
  if (!s) return [];
  const out: [number, number][] = [];
  for (const part of s.split(/[,;\s]+/).filter(Boolean)) {
    const m = /^#?(\d+)(?:-#?(\d+))?$/.exec(part);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < 1) return null;
    out.push(a <= b ? [a, b] : [b, a]);
  }
  return out;
}

export function inRanges(n: number, ranges: [number, number][]) {
  return ranges.some(([a, b]) => n >= a && n <= b);
}

/** Tidy form for the URL and titles: "10-20, 34". */
export function formatRanges(ranges: [number, number][]) {
  return ranges.map(([a, b]) => (a === b ? String(a) : `${a}-${b}`)).join(", ");
}
