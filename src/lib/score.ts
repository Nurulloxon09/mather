// Estimated SAT Math section score (200–800) from a full exam's raw score.
//
// College Board doesn't publish a raw-to-scaled table for the adaptive Digital SAT; scores come
// from item-response theory. These curves follow the shape of typical Bluebook practice-test
// results: the harder Module 2 can reach 800, the easier one tops out around 650. It's an
// estimate, shown with a ±30 range. Raw scores are scaled to 44 questions first.

type Curve = [raw: number, score: number][];

const STANDARD: Curve = [
  [0, 200],
  [5, 270],
  [10, 350],
  [15, 420],
  [20, 480],
  [25, 540],
  [30, 600],
  [35, 660],
  [38, 700],
  [40, 730],
  [42, 770],
  [43, 790],
  [44, 800],
];

/** Routed to the harder Module 2 (Module 1 went well). */
const HARDER: Curve = [
  [0, 200],
  [14, 440],
  [20, 510],
  [25, 570],
  [30, 630],
  [35, 690],
  [38, 730],
  [40, 750],
  [42, 780],
  [43, 790],
  [44, 800],
];

/** Routed to the easier Module 2: the ceiling is lower no matter how Module 2 goes. */
const EASIER: Curve = [
  [0, 200],
  [5, 260],
  [10, 330],
  [15, 400],
  [20, 450],
  [25, 500],
  [30, 540],
  [35, 580],
  [40, 620],
  [44, 650],
];

export type ScoreEstimate = { score: number; low: number; high: number };

const RANGE = 30;
const round10 = (n: number) => Math.round(n / 10) * 10;

function interpolate(curve: Curve, raw: number) {
  for (let i = 1; i < curve.length; i++) {
    const [r1, s1] = curve[i];
    if (raw <= r1) {
      const [r0, s0] = curve[i - 1];
      return s0 + ((raw - r0) / (r1 - r0)) * (s1 - s0);
    }
  }
  return curve[curve.length - 1][1];
}

/** `route` is the Module 2 an adaptive exam took; leave it out for a non-adaptive exam. */
export function estimateScore(correct: number, total: number, route?: "harder" | "easier" | null): ScoreEstimate {
  const raw = total > 0 ? Math.max(0, Math.min(44, (correct / total) * 44)) : 0;
  const curve = route === "harder" ? HARDER : route === "easier" ? EASIER : STANDARD;
  const score = Math.max(200, Math.min(800, round10(interpolate(curve, raw))));
  return { score, low: Math.max(200, score - RANGE), high: Math.min(800, score + RANGE) };
}
