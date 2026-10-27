// Grid-in (student-produced response) entry rules and answer checking,
// following the Digital SAT conventions:
// - up to 5 characters for a positive answer, 6 for a negative one (the "-" counts)
// - fractions and decimals are both fine; equivalent forms get credit
// - a non-terminating value may be truncated or rounded, but only if the
//   entry uses all available characters (2/3 → .6666, .6667, 0.666, 0.667;
//   not .66 or 0.67)

type Rational = { n: bigint; d: bigint };

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const TEN = BigInt(10);

function abs(x: bigint) {
  return x < ZERO ? -x : x;
}

function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a || ONE;
}

function make(n: bigint, d: bigint): Rational {
  if (d < ZERO) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function eq(a: Rational, b: Rational) {
  return a.n === b.n && a.d === b.d;
}

const DECIMAL_RE = /^(-?)(\d*)\.?(\d*)$/;
const FRACTION_RE = /^(-?)(\d+)\/(\d+)$/;

export function maxLength(entry: string) {
  return entry.startsWith("-") ? 6 : 5;
}

/** Parse a complete entry (or an answer-key value) into an exact rational. */
export function parseValue(raw: string): Rational | null {
  const s = raw.trim();
  const f = FRACTION_RE.exec(s);
  if (f) {
    const d = BigInt(f[3]);
    if (d === ZERO) return null;
    const n = BigInt(f[2]);
    return make(f[1] ? -n : n, d);
  }
  const m = DECIMAL_RE.exec(s);
  if (!m || (!m[2] && !m[3])) return null;
  const digits = (m[2] || "0") + m[3];
  const n = BigInt(digits);
  const d = TEN ** BigInt(m[3].length);
  return make(m[1] ? -n : n, d);
}

/** Whether the keystroke result is something the answer box would accept. */
export function isAllowedPartial(entry: string) {
  if (entry === "") return true;
  if (entry.length > maxLength(entry)) return false;
  if (!/^-?[0-9./]*$/.test(entry)) return false;
  const body = entry.replace(/^-/, "");
  if (body.includes("-")) return false;
  const dots = (body.match(/\./g) || []).length;
  const slashes = (body.match(/\//g) || []).length;
  if (dots > 1 || slashes > 1) return false;
  if (dots && slashes) return false;
  if (body.startsWith("/")) return false;
  return true;
}

/** A finished entry that can be graded (not "-", ".", "3/", etc). */
export function isCompleteEntry(entry: string) {
  return isAllowedPartial(entry) && parseValue(entry) !== null;
}

function scaleTo(value: Rational, places: number, mode: "trunc" | "round") {
  const scale = TEN ** BigInt(places);
  const neg = value.n < ZERO;
  const num = abs(value.n) * scale;
  const q =
    mode === "trunc" ? num / value.d : (num * TWO + value.d) / (TWO * value.d);
  return make(neg ? -q : q, scale);
}

export function isGridCorrect(entry: string, answers: string[]) {
  const s = entry.trim();
  if (!isCompleteEntry(s)) return false;
  const v = parseValue(s)!;
  const isDecimal = s.includes(".");
  const fillsBox = s.length === maxLength(s);
  const places = isDecimal ? s.split(".")[1].length : 0;

  return answers.some((a) => {
    const exact = parseValue(a);
    if (!exact) return a.trim() === s;
    if (eq(v, exact)) return true;
    if (isDecimal && fillsBox && places > 0) {
      return (
        eq(v, scaleTo(exact, places, "trunc")) ||
        eq(v, scaleTo(exact, places, "round"))
      );
    }
    return false;
  });
}

/** LaTeX for the live "Answer Preview" under the grid-in box. */
export function entryToTex(entry: string) {
  const f = /^(-?)(\d+)\/(\d*)$/.exec(entry);
  if (f) return `${f[1]}\\dfrac{${f[2]}}{${f[3] || "\\phantom{0}"}}`;
  return entry;
}

/** Readable form of the accepted answers for result screens. */
export function formatGridAnswers(answers: string[]) {
  return answers.join(", ");
}
