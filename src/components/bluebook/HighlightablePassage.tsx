"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Eraser, Highlighter } from "lucide-react";
import {
  addHighlight,
  HIGHLIGHT_COLORS,
  overlapsHighlight,
  recolorHighlightById,
  removeHighlightById,
  removeHighlightRange,
} from "@/lib/highlights";
import type { HighlightColor, TextHighlight } from "@/lib/types";
import { Rich } from "../Rich";

const MemoRich = memo(Rich);

type PopoverState =
  | { kind: "range"; start: number; end: number; x: number; y: number; hasOverlap: boolean }
  | { kind: "mark"; id: string; color: HighlightColor; x: number; y: number };

function newHlId() {
  return "hl_" + Math.random().toString(36).slice(2, 9);
}

function unwrapMarks(container: HTMLElement) {
  const marks = container.querySelectorAll("mark[data-hl-id]");
  if (!marks.length) return;
  const parents = new Set<Node>();
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    parents.add(parent);
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
  parents.forEach((p) => {
    if (p instanceof HTMLElement || p instanceof Node) p.normalize();
  });
}

function applyMarks(container: HTMLElement, highlights: TextHighlight[]) {
  if (!highlights.length) return;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: { node: Text; start: number; end: number }[] = [];
  let pos = 0;
  let current = walker.nextNode();
  while (current) {
    const text = current as Text;
    const len = text.data.length;
    if (len > 0) {
      textNodes.push({ node: text, start: pos, end: pos + len });
      pos += len;
    }
    current = walker.nextNode();
  }

  for (const { node, start, end } of textNodes) {
    const overlapping = highlights.filter((h) => h.start < end && h.end > start);
    if (!overlapping.length) continue;

    const frag = document.createDocumentFragment();
    let cursor = start;
    const data = node.data;

    for (const h of overlapping) {
      const segStart = Math.max(start, h.start);
      const segEnd = Math.min(end, h.end);
      if (segStart > cursor) {
        frag.appendChild(document.createTextNode(data.slice(cursor - start, segStart - start)));
      }
      if (segEnd > segStart) {
        const mark = document.createElement("mark");
        mark.className = "bb-hl";
        mark.dataset.hlId = h.id;
        mark.dataset.hlColor = h.color;
        mark.textContent = data.slice(segStart - start, segEnd - start);
        frag.appendChild(mark);
      }
      cursor = Math.max(cursor, segEnd);
    }

    if (cursor < end) {
      frag.appendChild(document.createTextNode(data.slice(cursor - start, end - start)));
    }
    node.parentNode?.replaceChild(frag, node);
  }
}

function offsetAt(root: HTMLElement, node: Node, offset: number): number {
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(node, offset);
  return r.cloneContents().textContent?.length ?? 0;
}

export function HighlightablePassage({
  src,
  highlights,
  highlightMode,
  activeColor,
  onChange,
}: {
  src: string;
  highlights: TextHighlight[];
  highlightMode: boolean;
  activeColor: HighlightColor;
  onChange: (next: TextHighlight[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    unwrapMarks(el);
    applyMarks(el, highlights);
  }, [src, highlights]);

  useEffect(() => {
    if (!popover) return;
    const onDown = (e: PointerEvent) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      setPopover(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPopover(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [popover]);

  const handleSelection = () => {
    const el = containerRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) return;
    if (!range.toString().trim()) return;

    const start = offsetAt(el, range.startContainer, range.startOffset);
    const end = offsetAt(el, range.endContainer, range.endOffset);
    if (end <= start) return;

    if (highlightMode) {
      onChange(addHighlight(highlights, start, end, activeColor, newHlId()));
      sel.removeAllRanges();
      setPopover(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2, 110), window.innerWidth - 110);
    const y = Math.max(rect.top - 10, 84);
    setPopover({
      kind: "range",
      start,
      end,
      x,
      y,
      hasOverlap: overlapsHighlight(highlights, start, end),
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const target = e.target as HTMLElement | null;
    const mark = target?.closest("mark[data-hl-id]") as HTMLElement | null;
    if (!mark || !containerRef.current?.contains(mark)) return;
    const id = mark.dataset.hlId;
    const color = (mark.dataset.hlColor as HighlightColor) || "yellow";
    if (!id) return;
    const rect = mark.getBoundingClientRect();
    const x = Math.min(Math.max(rect.left + rect.width / 2, 110), window.innerWidth - 110);
    const y = Math.max(rect.top - 10, 84);
    setPopover({ kind: "mark", id, color, x, y });
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onMouseUp={handleSelection}
        onKeyUp={handleSelection}
        onClick={handleClick}
        className={highlightMode ? "cursor-text selection:bg-[#fef08a]/60" : undefined}
      >
        <MemoRich src={src} />
      </div>

      {popover && (
        <div
          ref={popoverRef}
          role="toolbar"
          aria-label="Highlight text"
          onMouseDown={(e) => e.preventDefault()}
          className="fixed z-40 flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-lg border border-[#1e1e1e] bg-white px-2.5 py-1.5 shadow-xl"
          style={{ left: popover.x, top: popover.y }}
        >
          <Highlighter size={14} className="mr-0.5 text-bb-muted" aria-hidden="true" />
          {HIGHLIGHT_COLORS.map((c) => {
            const active = popover.kind === "mark" && popover.color === c.id;
            return (
              <button
                key={c.id}
                type="button"
                title={`Highlight ${c.label}`}
                aria-label={`Highlight ${c.label}`}
                onClick={() => {
                  if (popover.kind === "range") {
                    onChange(addHighlight(highlights, popover.start, popover.end, c.id, newHlId()));
                    window.getSelection()?.removeAllRanges();
                  } else {
                    onChange(recolorHighlightById(highlights, popover.id, c.id));
                  }
                  setPopover(null);
                }}
                className={`h-6 w-6 rounded-full border transition-transform hover:scale-110 ${
                  active ? "border-[#1e1e1e] ring-2 ring-[#1e1e1e]/30" : "border-black/20"
                }`}
                style={{ backgroundColor: c.swatch }}
              />
            );
          })}
          {(popover.kind === "mark" || popover.hasOverlap) && (
            <>
              <span className="mx-0.5 h-4 w-px bg-bb-line" aria-hidden="true" />
              <button
                type="button"
                title="Remove highlight"
                aria-label="Remove highlight"
                onClick={() => {
                  if (popover.kind === "mark") {
                    onChange(removeHighlightById(highlights, popover.id));
                  } else {
                    onChange(removeHighlightRange(highlights, popover.start, popover.end));
                    window.getSelection()?.removeAllRanges();
                  }
                  setPopover(null);
                }}
                className="flex items-center gap-1 rounded px-1.5 py-1 text-xs font-semibold text-bb-red hover:bg-bb-red-soft"
              >
                <Eraser size={13} aria-hidden="true" />
                Remove
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
