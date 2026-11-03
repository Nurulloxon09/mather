import JSZip from "jszip";
import { ommlToLatex } from "../omml";

// Word (.docx) → question markup, in the browser. Paragraphs become blocks, equations become
// $...$ / $$...$$, tables become | rows |, automatic numbering is written out ("12.", "B."),
// and pictures become [[IMG n]] tokens that the uploader swaps for stored images.

export type DocxImage = { token: string; blob: Blob; mime: string; width: number };
export type DocxChunk = { text: string; images: DocxImage[] };

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp" };

const kids = (el: Element) => Array.from(el.children);
const attr = (el: Element | null | undefined, name: string) => {
  if (!el) return undefined;
  for (const a of Array.from(el.attributes)) if (a.localName === name) return a.value;
  return undefined;
};
const find = (el: Element, name: string): Element | undefined => {
  for (const c of kids(el)) {
    if (c.localName === name) return c;
    const deep = find(c, name);
    if (deep) return deep;
  }
  return undefined;
};

function roman(n: number) {
  const map: [number, string][] = [[10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
  let out = "";
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

function formatNumber(n: number, fmt: string) {
  switch (fmt) {
    case "upperLetter":
      return String.fromCharCode(64 + ((n - 1) % 26) + 1);
    case "lowerLetter":
      return String.fromCharCode(96 + ((n - 1) % 26) + 1);
    case "upperRoman":
      return roman(n).toUpperCase();
    case "lowerRoman":
      return roman(n);
    default:
      return String(n);
  }
}

type NumRef = { numId: string; ilvl: number };

/** List numbering attached to paragraph styles ("List Number" and friends), following basedOn. */
function styleNumbering(xml: Document | null) {
  const own = new Map<string, NumRef>();
  const parent = new Map<string, string>();
  for (const s of Array.from(xml?.getElementsByTagNameNS("*", "style") ?? [])) {
    const id = attr(s, "styleId") ?? "";
    const numPr = find(find(s, "pPr") ?? s, "numPr");
    const numId = attr(find(numPr ?? s, "numId"), "val");
    if (numPr && numId) own.set(id, { numId, ilvl: Number(attr(find(numPr, "ilvl"), "val") ?? 0) });
    const based = attr(find(s, "basedOn"), "val");
    if (based) parent.set(id, based);
  }
  return (styleId: string | undefined) => {
    for (let id = styleId, i = 0; id && i < 10; id = parent.get(id), i++) {
      const n = own.get(id);
      if (n) return n;
    }
    return undefined;
  };
}

/** Writes out Word's automatic list numbering, which isn't part of the text. */
function numberingFor(xml: Document | null, fromStyle: (styleId: string | undefined) => NumRef | undefined) {
  const levels = new Map<string, { fmt: string; start: number }>(); // `${abstractId}:${ilvl}`
  const numToAbstract = new Map<string, string>();
  if (xml) {
    for (const an of Array.from(xml.getElementsByTagNameNS("*", "abstractNum"))) {
      const aid = attr(an, "abstractNumId") ?? "";
      for (const lvl of kids(an).filter((k) => k.localName === "lvl")) {
        levels.set(`${aid}:${attr(lvl, "ilvl")}`, {
          fmt: attr(find(lvl, "numFmt"), "val") ?? "decimal",
          start: Number(attr(find(lvl, "start"), "val") ?? 1),
        });
      }
    }
    for (const num of Array.from(xml.getElementsByTagNameNS("*", "num"))) {
      const aid = attr(find(num, "abstractNumId"), "val");
      if (aid) numToAbstract.set(attr(num, "numId") ?? "", aid);
    }
  }
  const counters = new Map<string, number[]>();
  return (p: Element) => {
    const pPr = kids(p).find((k) => k.localName === "pPr");
    const numPr = pPr && kids(pPr).find((k) => k.localName === "numPr");
    const styled = fromStyle(attr(pPr && kids(pPr).find((k) => k.localName === "pStyle"), "val"));
    const numId = (numPr && attr(find(numPr, "numId"), "val")) ?? styled?.numId;
    if (!numId) return "";
    const ilvl = Number((numPr && attr(find(numPr, "ilvl"), "val")) ?? styled?.ilvl ?? 0);
    const aid = numToAbstract.get(numId);
    if (!aid || numId === "0") return "";
    const lvl = levels.get(`${aid}:${ilvl}`) ?? { fmt: "decimal", start: 1 };
    const c = counters.get(numId) ?? [];
    c[ilvl] = (c[ilvl] ?? lvl.start - 1) + 1;
    c.length = ilvl + 1; // deeper levels restart
    counters.set(numId, c);
    if (lvl.fmt === "bullet") return "- ";
    if (lvl.fmt === "none") return "";
    return `${formatNumber(c[ilvl], lvl.fmt)}. `;
  };
}

export async function convertDocx(file: Blob, maxChars = 3500): Promise<DocxChunk[]> {
  const zip = await JSZip.loadAsync(file);
  const read = async (path: string) => {
    const f = zip.file(path);
    return f ? new DOMParser().parseFromString(await f.async("text"), "application/xml") : null;
  };
  const doc = await read("word/document.xml");
  if (!doc) throw new Error("This doesn't look like a Word document");
  const rels = new Map<string, string>();
  const relsXml = await read("word/_rels/document.xml.rels");
  for (const r of Array.from(relsXml?.getElementsByTagNameNS("*", "Relationship") ?? [])) {
    rels.set(r.getAttribute("Id") ?? "", r.getAttribute("Target") ?? "");
  }
  const number = numberingFor(await read("word/numbering.xml"), styleNumbering(await read("word/styles.xml")));

  const images: DocxImage[] = [];
  const imageToken = async (drawing: Element) => {
    const blip = find(drawing, "blip") ?? find(drawing, "imagedata");
    const rid = attr(blip, "embed") ?? attr(blip, "id");
    const target = rid ? rels.get(rid) : undefined;
    if (!target) return "";
    const path = target.startsWith("/") ? target.slice(1) : `word/${target.replace(/^\.\//, "")}`;
    const ext = path.split(".").pop()?.toLowerCase() ?? "";
    const f = zip.file(path);
    if (!f || !MIME[ext]) return " (picture in a format the browser can't show) ";
    const extent = find(drawing, "extent");
    const width = extent ? Math.round(Number(attr(extent, "cx")) / 9525) : 320;
    const token = `[[IMG ${images.length + 1}]]`;
    images.push({ token, blob: new Blob([await f.async("arraybuffer")], { type: MIME[ext] }), mime: MIME[ext], width });
    return `\n${token}\n`;
  };

  const inline = async (el: Element): Promise<{ text: string; display: string[] }> => {
    let text = "";
    const display: string[] = [];
    for (const c of kids(el)) {
      switch (c.localName) {
        case "t":
          text += (c.textContent ?? "").replace(/\$/g, "\\$");
          break;
        case "tab":
          text += " ";
          break;
        case "br":
        case "cr":
          text += "\n";
          break;
        case "drawing":
        case "pict":
          text += await imageToken(c);
          break;
        case "oMath":
          text += `$${ommlToLatex(c)}$`;
          break;
        case "oMathPara":
          display.push(ommlToLatex(c));
          break;
        case "del":
        case "pPr":
        case "rPr":
          break;
        default: {
          const sub = await inline(c);
          text += sub.text;
          display.push(...sub.display);
        }
      }
    }
    return { text, display };
  };

  const blocks: string[] = [];
  const paragraph = async (p: Element) => {
    const { text, display } = await inline(p);
    const out: string[] = [];
    const body = text.replace(/[ \t]+\n/g, "\n").trim();
    if (body) out.push(number(p) + body);
    else number(p);
    for (const d of display) out.push(`$$${d}$$`);
    return out.join("\n\n");
  };

  const table = async (tbl: Element) => {
    const rows: string[] = [];
    for (const tr of kids(tbl).filter((k) => k.localName === "tr")) {
      const cells: string[] = [];
      for (const tc of kids(tr).filter((k) => k.localName === "tc")) {
        const parts = [];
        for (const p of kids(tc).filter((k) => k.localName === "p")) parts.push((await paragraph(p)).replace(/\n+/g, " "));
        cells.push(parts.join(" ").replace(/\|/g, "\\|").trim());
      }
      rows.push(`| ${cells.join(" | ")} |`);
      if (rows.length === 1) rows.push(`|${cells.map(() => "---").join("|")}|`);
    }
    return rows.join("\n");
  };

  const walk = async (el: Element) => {
    for (const c of kids(el)) {
      if (c.localName === "p") {
        const s = await paragraph(c);
        if (s) blocks.push(s);
      } else if (c.localName === "tbl") {
        blocks.push(await table(c));
      } else if (c.localName === "sdt" || c.localName === "sdtContent" || c.localName === "customXml") {
        await walk(c);
      }
    }
  };
  const body = find(doc.documentElement, "body");
  if (body) await walk(body);

  // Group blocks into chunks the AI reads one at a time, like pages.
  const chunks: DocxChunk[] = [];
  let cur: string[] = [];
  let len = 0;
  const flush = () => {
    if (!cur.length) return;
    const text = cur.join("\n\n");
    chunks.push({ text, images: images.filter((im) => text.includes(im.token)) });
    cur = [];
    len = 0;
  };
  for (const b of blocks) {
    if (len + b.length > maxChars && len > 0) flush();
    cur.push(b);
    len += b.length;
  }
  flush();
  return chunks;
}
