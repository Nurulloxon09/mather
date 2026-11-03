// Office Math (OMML, the equations inside .docx files) → LaTeX.
// Covers what SAT material uses: fractions, scripts, roots, brackets, sums, functions,
// accents, bars, equation arrays and matrices. Unknown elements fall back to their content.

const SYMBOLS: Record<string, string> = {
  "≤": "\\le ",
  "≥": "\\ge ",
  "≠": "\\ne ",
  "×": "\\times ",
  "÷": "\\div ",
  "·": "\\cdot ",
  "⋅": "\\cdot ",
  "−": "-",
  "–": "-",
  "±": "\\pm ",
  "∓": "\\mp ",
  "≈": "\\approx ",
  "∞": "\\infty ",
  "π": "\\pi ",
  "θ": "\\theta ",
  "α": "\\alpha ",
  "β": "\\beta ",
  "γ": "\\gamma ",
  "Δ": "\\Delta ",
  "δ": "\\delta ",
  "λ": "\\lambda ",
  "μ": "\\mu ",
  "σ": "\\sigma ",
  "φ": "\\varphi ",
  "ω": "\\omega ",
  "°": "^{\\circ}",
  "∠": "\\angle ",
  "△": "\\triangle ",
  "∆": "\\triangle ",
  "⊥": "\\perp ",
  "∥": "\\parallel ",
  "→": "\\to ",
  "∈": "\\in ",
  "∪": "\\cup ",
  "∩": "\\cap ",
  "√": "\\sqrt{}",
  "′": "'",
  "%": "\\%",
  "$": "\\$",
  "#": "\\#",
  "{": "\\{",
  "}": "\\}",
  "…": "\\ldots ",
  "⋯": "\\cdots ",
};

const ACCENTS: Record<string, string> = {
  "̂": "\\hat",
  "^": "\\hat",
  "̅": "\\overline",
  "¯": "\\overline",
  "⃗": "\\vec",
  "→": "\\vec",
  "̇": "\\dot",
  "̃": "\\tilde",
  "~": "\\tilde",
};

const NARY: Record<string, string> = { "∑": "\\sum", "∏": "\\prod", "∫": "\\int", "∬": "\\iint", "∮": "\\oint" };

const FUNCS = new Set(["sin", "cos", "tan", "cot", "sec", "csc", "log", "ln", "lim", "max", "min", "exp"]);

const kids = (el: Element) => Array.from(el.children);
const child = (el: Element, name: string) => kids(el).find((c) => c.localName === name);
const attr = (el: Element | undefined, name: string) => {
  if (!el) return undefined;
  for (const a of Array.from(el.attributes)) if (a.localName === name) return a.value;
  return undefined;
};
const prop = (el: Element, pr: string, name: string) => attr(child(child(el, pr) ?? el, name), "val");

function text(s: string, inArray: boolean) {
  let out = "";
  for (const ch of s) {
    if (ch === "&") out += inArray ? "&" : "\\&";
    else out += SYMBOLS[ch] ?? ch;
  }
  return out;
}

function group(el: Element | undefined, inArray = false) {
  return el ? convertChildren(el, inArray) : "";
}

function convertChildren(el: Element, inArray = false): string {
  return kids(el)
    .map((c) => convert(c, inArray))
    .join("");
}

function convert(el: Element, inArray = false): string {
  switch (el.localName) {
    case "r": {
      const t = kids(el)
        .filter((c) => c.localName === "t")
        .map((c) => c.textContent ?? "")
        .join("");
      const plain = child(child(el, "rPr") ?? el, "nor");
      if (plain && /[A-Za-z]{2,}/.test(t)) return `\\text{${t.replace(/[{}\\]/g, "")}}`;
      if (FUNCS.has(t.trim())) return `\\${t.trim()} `;
      return text(t, inArray);
    }
    case "f": {
      const type = prop(el, "fPr", "type");
      const num = group(child(el, "num"), inArray);
      const den = group(child(el, "den"), inArray);
      return type === "lin" || type === "skw" ? `${num}/${den}` : type === "noBar" ? `\\binom{${num}}{${den}}` : `\\frac{${num}}{${den}}`;
    }
    case "sSup":
      return `{${group(child(el, "e"), inArray)}}^{${group(child(el, "sup"), inArray)}}`;
    case "sSub":
      return `{${group(child(el, "e"), inArray)}}_{${group(child(el, "sub"), inArray)}}`;
    case "sSubSup":
      return `{${group(child(el, "e"), inArray)}}_{${group(child(el, "sub"), inArray)}}^{${group(child(el, "sup"), inArray)}}`;
    case "sPre":
      return `{}_{${group(child(el, "sub"), inArray)}}^{${group(child(el, "sup"), inArray)}}{${group(child(el, "e"), inArray)}}`;
    case "rad": {
      const hidden = ["1", "on", "true"].includes(prop(el, "radPr", "degHide") ?? "");
      const deg = group(child(el, "deg"), inArray);
      const body = group(child(el, "e"), inArray);
      return hidden || !deg ? `\\sqrt{${body}}` : `\\sqrt[${deg}]{${body}}`;
    }
    case "d": {
      const beg = prop(el, "dPr", "begChr") ?? "(";
      const end = prop(el, "dPr", "endChr") ?? ")";
      const sep = prop(el, "dPr", "sepChr") ?? ",";
      const parts = kids(el)
        .filter((c) => c.localName === "e")
        .map((c) => convertChildren(c, inArray));
      const delim = (c: string, side: "left" | "right") => {
        if (!c) return `\\${side}.`;
        const map: Record<string, string> = { "{": "\\{", "}": "\\}", "|": "|", "‖": "\\|", "⌊": "\\lfloor", "⌋": "\\rfloor", "⌈": "\\lceil", "⌉": "\\rceil", "〈": "\\langle", "〉": "\\rangle" };
        return `\\${side}${map[c] ?? c}`;
      };
      return `${delim(beg, "left")}${parts.join(text(sep, inArray))}${delim(end, "right")}`;
    }
    case "nary": {
      const chr = prop(el, "naryPr", "chr") ?? "∫";
      const sub = group(child(el, "sub"), inArray);
      const sup = group(child(el, "sup"), inArray);
      return `${NARY[chr] ?? text(chr, inArray)}${sub ? `_{${sub}}` : ""}${sup ? `^{${sup}}` : ""}{${group(child(el, "e"), inArray)}}`;
    }
    case "func": {
      const name = group(child(el, "fName"), inArray).trim();
      const fn = name.replace(/^\\/, "").trim();
      return `${FUNCS.has(fn) ? `\\${fn}` : name} ${group(child(el, "e"), inArray)}`;
    }
    case "acc": {
      const chr = prop(el, "accPr", "chr") ?? "̂";
      return `${ACCENTS[chr] ?? "\\hat"}{${group(child(el, "e"), inArray)}}`;
    }
    case "bar":
      return prop(el, "barPr", "pos") === "bot"
        ? `\\underline{${group(child(el, "e"), inArray)}}`
        : `\\overline{${group(child(el, "e"), inArray)}}`;
    case "limLow":
      return `\\mathop{${group(child(el, "e"), inArray)}}\\limits_{${group(child(el, "lim"), inArray)}}`;
    case "limUpp":
      return `\\mathop{${group(child(el, "e"), inArray)}}\\limits^{${group(child(el, "lim"), inArray)}}`;
    case "eqArr": {
      const rows = kids(el)
        .filter((c) => c.localName === "e")
        .map((c) => convertChildren(c, true));
      const aligned = rows.some((r) => r.includes("&"));
      return `\\begin{${aligned ? "aligned" : "gathered"}}${rows.join(" \\\\ ")}\\end{${aligned ? "aligned" : "gathered"}}`;
    }
    case "m": {
      const rows = kids(el)
        .filter((c) => c.localName === "mr")
        .map((mr) =>
          kids(mr)
            .filter((c) => c.localName === "e")
            .map((c) => convertChildren(c))
            .join(" & "),
        );
      return `\\begin{matrix}${rows.join(" \\\\ ")}\\end{matrix}`;
    }
    case "oMathPara": {
      // Several equations in one display paragraph go on separate lines.
      const lines = kids(el)
        .filter((k) => k.localName === "oMath")
        .map((k) => convert(k, inArray));
      return lines.length > 1 ? `\\begin{gathered}${lines.join(" \\\\ ")}\\end{gathered}` : (lines[0] ?? "");
    }
    default:
      // Property elements carry formatting only.
      if (el.localName.endsWith("Pr")) return "";
      return convertChildren(el, inArray);
  }
}

/** LaTeX for an <m:oMath> or <m:oMathPara> element, with stray spaces tidied. */
export function ommlToLatex(el: Element) {
  return convert(el).replace(/\s+/g, " ").trim();
}
