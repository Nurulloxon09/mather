// Typing a LaTeX expression into Desmos one keystroke at a time.
//
// Desmos only accepts whole expressions through its API, so "typing" means sending a series of
// complete expressions, each one keystroke further along. Every frame is balanced LaTeX: like the
// real calculator, typing a fraction shows an empty fraction first, an opening parenthesis brings
// its closing one, and a power gets an empty box to fill.

/** One step of a "Desmos way" walkthrough: what to type, and what to say about it. */
export type DesmosStep = {
  say: string;
  latex: string;
  /** Data typed into a table, column by column (header such as x_{1}, then the values). */
  table?: { header: string; values: string[] }[];
  /** The step whose result shows the answer. */
  answerStep?: boolean;
};

export type DesmosWay = {
  /** False when Desmos doesn't make the question easier; there are no steps then. */
  useful: boolean;
  steps: DesmosStep[];
  view?: { left: number; right: number; bottom: number; top: number };
  answer: string;
  /** Set when the AI's walkthroughs kept reaching a wrong answer, so none is shown (and none kept). */
  unverified?: boolean;
};

type Node =
  | { t: "atom"; s: string }
  | { t: "group"; kids: Node[] }
  | { t: "cmd"; name: string; opt?: Node[]; args: Node[][] }
  | { t: "script"; op: "^" | "_"; arg: Node[] }
  | { t: "lr"; open: string; close: string; kids: Node[] };

/** Commands that take braced arguments, and how many. */
const ARGS: Record<string, number> = {
  "\\frac": 2,
  "\\dfrac": 2,
  "\\tfrac": 2,
  "\\binom": 2,
  "\\sqrt": 1,
  "\\overline": 1,
  "\\vec": 1,
  "\\hat": 1,
};
/** Commands whose argument is a name, typed as one piece (\operatorname{mean}, \text{...}). */
const WHOLE = new Set(["\\operatorname", "\\text", "\\mathrm", "\\mathbf"]);

export function tokenize(latex: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < latex.length; ) {
    const c = latex[i];
    if (c === "\\") {
      const m = /^\\([a-zA-Z]+|.)/.exec(latex.slice(i));
      const tok = m ? m[0] : "\\";
      out.push(tok);
      i += tok.length;
    } else {
      if (!/\s/.test(c)) out.push(c);
      i++;
    }
  }
  return out;
}

class Parser {
  i = 0;
  constructor(private toks: string[]) {}

  peek() {
    return this.toks[this.i];
  }

  /** Nodes until `stop` (consumed) or the end. */
  seq(stop?: (tok: string) => boolean): Node[] {
    const out: Node[] = [];
    while (this.i < this.toks.length) {
      const tok = this.peek();
      if (stop?.(tok)) {
        this.i++;
        return out;
      }
      if (tok === "}" || tok === "\\right") return out; // unbalanced: let the caller close it
      out.push(this.node());
    }
    return out;
  }

  /** A braced group's contents, or a single node. */
  arg(): Node[] {
    if (this.peek() === "{") {
      this.i++;
      return this.seq((t) => t === "}");
    }
    return this.i < this.toks.length && this.peek() !== "}" ? [this.node()] : [];
  }

  node(): Node {
    const tok = this.toks[this.i++];
    if (tok === "{") return { t: "group", kids: this.seq((t) => t === "}") };
    if (tok === "^" || tok === "_") return { t: "script", op: tok, arg: this.arg() };
    if (tok === "\\left") {
      const d = this.toks[this.i++] ?? "(";
      const kids = this.seq((t) => t === "\\right");
      const close = this.toks[this.i - 1] === "\\right" ? (this.toks[this.i++] ?? ")") : MATCH[d] ?? ")";
      return { t: "lr", open: `\\left${d}`, close: `\\right${close}`, kids };
    }
    if (WHOLE.has(tok) && this.peek() === "{") {
      let depth = 0;
      let s = tok;
      do {
        const t = this.toks[this.i++];
        if (t === undefined) break;
        if (t === "{") depth++;
        if (t === "}") depth--;
        s += t;
      } while (depth > 0);
      return { t: "atom", s };
    }
    const n = ARGS[tok];
    if (n) {
      let opt: Node[] | undefined;
      if (tok === "\\sqrt" && this.peek() === "[") {
        this.i++;
        opt = this.seq((t) => t === "]");
      }
      const args: Node[][] = [];
      for (let k = 0; k < n; k++) args.push(this.arg());
      return { t: "cmd", name: tok, opt, args };
    }
    return { t: "atom", s: tok };
  }
}

const MATCH: Record<string, string> = { "(": ")", "[": "]", "|": "|", "\\{": "\\}", "\\lbrace": "\\rbrace", ".": "." };

export function parse(latex: string): Node[] {
  const toks = tokenize(latex);
  const p = new Parser(toks);
  const out: Node[] = [];
  // Stray closers at the top level are kept as plain characters.
  while (p.i < toks.length) {
    out.push(...p.seq());
    if (p.i < toks.length) out.push({ t: "atom", s: toks[p.i++] });
  }
  return out;
}

/** Keystrokes needed to type the nodes. */
function cost(nodes: Node[]): number {
  let n = 0;
  for (const x of nodes) {
    if (x.t === "atom") n += 1;
    else if (x.t === "group") n += cost(x.kids);
    else if (x.t === "cmd") n += 1 + (x.opt ? cost(x.opt) : 0) + x.args.reduce((a, g) => a + cost(g), 0);
    else if (x.t === "script") n += 1 + cost(x.arg);
    else n += 1 + cost(x.kids);
  }
  return n;
}

/** The LaTeX after `budget` keystrokes; anything not reached yet is left empty. */
function emit(nodes: Node[], budget: { left: number }): string {
  let s = "";
  for (const x of nodes) {
    if (budget.left <= 0) break;
    if (x.t === "atom") {
      budget.left--;
      // A letter right after a command name needs a space between them.
      s += /^\\[a-zA-Z]+$/.test(s.match(/\\[a-zA-Z]+$/)?.[0] ?? "") && /^[a-zA-Z]/.test(x.s) ? ` ${x.s}` : x.s;
    } else if (x.t === "group") {
      s += `{${emit(x.kids, budget)}}`;
    } else if (x.t === "cmd") {
      budget.left--;
      s += x.name;
      if (x.opt) s += `[${emit(x.opt, budget)}]`;
      for (const g of x.args) s += `{${emit(g, budget)}}`;
    } else if (x.t === "script") {
      budget.left--;
      s += `${x.op}{${emit(x.arg, budget)}}`;
    } else {
      budget.left--;
      s += `${x.open}${emit(x.kids, budget)}${x.close}`;
    }
  }
  return s;
}

/**
 * Every intermediate expression on the way to `latex`, one keystroke apart, ending with the whole
 * expression. Long expressions are thinned out to at most `max` frames (the last is always kept).
 */
export function typingFrames(latex: string, max = 80): string[] {
  const nodes = parse(latex);
  const total = cost(nodes);
  const frames: string[] = [];
  for (let b = 1; b <= total; b++) {
    const f = emit(nodes, { left: b });
    if (f !== frames[frames.length - 1]) frames.push(f);
  }
  if (frames.length <= max) return frames;
  const step = frames.length / max;
  const out: string[] = [];
  for (let k = 1; k <= max; k++) out.push(frames[Math.min(frames.length - 1, Math.round(k * step) - 1)]);
  return out;
}

/** "(4,7)" or "(-2.5, 3)": a point, which the walkthrough labels. */
export function isPoint(latex: string) {
  return /^\\?\(?\s*(\\left\()?\s*-?[\d.]+\s*,\s*-?[\d.]+\s*(\\right\))?\)?$/.test(latex.trim());
}

/** The label Desmos shows next to a point: "(4, 7)". */
export function pointLabel(latex: string) {
  const m = /(-?[\d.]+)\s*,\s*(-?[\d.]+)/.exec(latex);
  return m ? `(${m[1]}, ${m[2]})` : "";
}
