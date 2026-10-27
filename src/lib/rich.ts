import katex from "katex";

// Parser for the small markup used in question text (see Question in types.ts).

export type Block =
  | { t: "p"; html: string }
  | { t: "math"; html: string }
  | { t: "ul"; items: string[] }
  | { t: "img"; src: string; alt: string; width?: number }
  | { t: "table"; caption?: string; head?: string[]; rows: string[][] };

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ESC[c]);
}

export function tex(src: string, displayMode = false) {
  return katex.renderToString(src, {
    displayMode,
    throwOnError: false,
    strict: false,
    output: "html",
  });
}

/** Inline text with `$...$` math, `\$` dollars, `**bold**` and newlines. */
export function inlineHtml(src: string) {
  let out = "";
  let i = 0;
  let text = "";
  const flush = () => {
    out += escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
    text = "";
  };
  while (i < src.length) {
    const c = src[i];
    if (c === "\\" && src[i + 1] === "$") {
      text += "$";
      i += 2;
      continue;
    }
    if (c === "$") {
      let j = i + 1;
      while (j < src.length && !(src[j] === "$" && src[j - 1] !== "\\")) j++;
      flush();
      out += tex(src.slice(i + 1, j));
      i = j + 1;
      continue;
    }
    text += c;
    i++;
  }
  flush();
  return out;
}

const IMG_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)(?:\{w=(\d+)\})?$/;

function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => inlineHtml(c.trim().replace(/\\\|/g, "|")));
}

export function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  // Display math may contain blank lines; split around $$...$$ first.
  const parts = src.split(/(\$\$[\s\S]*?\$\$)/);
  for (const part of parts) {
    if (part.startsWith("$$") && part.endsWith("$$") && part.length >= 4) {
      blocks.push({ t: "math", html: tex(part.slice(2, -2).trim(), true) });
      continue;
    }
    for (const chunk of part.split(/\n\s*\n/)) {
      const s = chunk.trim();
      if (!s) continue;
      const img = IMG_RE.exec(s);
      if (img) {
        blocks.push({
          t: "img",
          alt: img[1],
          src: img[2],
          width: img[3] ? Number(img[3]) : undefined,
        });
        continue;
      }
      const lines = s.split("\n");
      const tableStart = lines.findIndex((l) => l.trim().startsWith("|"));
      if (tableStart !== -1 && lines.slice(tableStart).every((l) => l.trim().startsWith("|"))) {
        const caption = lines.slice(0, tableStart).join(" ").trim();
        const rowLines = lines.slice(tableStart);
        const sepIdx = rowLines.findIndex((l) => /^\|?\s*:?-{2,}/.test(l.trim()));
        let head: string[] | undefined;
        let body = rowLines;
        if (sepIdx === 1) {
          head = splitRow(rowLines[0]);
          body = rowLines.slice(2);
        }
        blocks.push({
          t: "table",
          caption: caption ? inlineHtml(caption) : undefined,
          head,
          rows: body.map(splitRow),
        });
        continue;
      }
      // "- item" lines become a bulleted list; other lines stay paragraphs.
      if (lines.some((l) => l.startsWith("- "))) {
        let para: string[] = [];
        const flushPara = () => {
          if (para.length) blocks.push({ t: "p", html: inlineHtml(para.join("\n")) });
          para = [];
        };
        for (const l of lines) {
          if (l.startsWith("- ")) {
            flushPara();
            const last = blocks[blocks.length - 1];
            const html = inlineHtml(l.slice(2));
            if (last?.t === "ul") last.items.push(html);
            else blocks.push({ t: "ul", items: [html] });
          } else para.push(l);
        }
        flushPara();
        continue;
      }
      blocks.push({ t: "p", html: inlineHtml(s) });
    }
  }
  return blocks;
}
