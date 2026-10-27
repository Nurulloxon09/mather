"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CloseIcon, CollapseIcon, ExpandIcon, GripIcon } from "./icons";

type Rect = { x: number; y: number; w: number; h: number };

/**
 * A draggable, resizable window used for the calculator and reference sheet.
 * Stays mounted while hidden so its contents (e.g. Desmos state) persist.
 */
export function FloatingPanel({
  title,
  open,
  onClose,
  initial,
  minW = 280,
  minH = 220,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  initial: Rect;
  minW?: number;
  minH?: number;
  children: ReactNode;
}) {
  const [rect, setRect] = useState<Rect>(initial);
  const [expanded, setExpanded] = useState(false);
  const before = useRef<Rect | null>(null);
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; start: Rect } | null>(null);

  const clamp = useCallback(
    (r: Rect): Rect => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(Math.max(r.w, minW), vw);
      const h = Math.min(Math.max(r.h, minH), vh);
      return {
        w,
        h,
        x: Math.min(Math.max(r.x, 0), vw - Math.min(w, 120)),
        // Stay below the top bar so the panel's handle is always reachable.
        y: Math.min(Math.max(r.y, 76), vh - 40),
      };
    },
    [minW, minH],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.sx;
      const dy = e.clientY - d.sy;
      setRect(
        clamp(
          d.mode === "move"
            ? { ...d.start, x: d.start.x + dx, y: d.start.y + dy }
            : { ...d.start, w: d.start.w + dx, h: d.start.h + dy },
        ),
      );
    };
    const onUp = () => {
      drag.current = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [clamp]);

  const begin = (mode: "move" | "resize", e: React.PointerEvent) => {
    if (expanded) return;
    e.preventDefault();
    drag.current = { mode, sx: e.clientX, sy: e.clientY, start: rect };
    document.body.style.userSelect = "none";
  };

  const toggleExpand = () => {
    if (expanded) {
      setRect(before.current ?? initial);
      setExpanded(false);
    } else {
      before.current = rect;
      setExpanded(true);
    }
  };

  const style = expanded
    ? { left: 16, top: 80, width: "calc(100vw - 32px)", height: "calc(100vh - 170px)" }
    : { left: rect.x, top: rect.y, width: rect.w, height: rect.h };

  return (
    <div
      role="dialog"
      aria-label={title}
      className="fixed z-20 flex flex-col overflow-hidden rounded-md border border-[#1e1e1e] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
      style={{ ...style, display: open ? "flex" : "none" }}
    >
      <div
        onPointerDown={(e) => begin("move", e)}
        onDoubleClick={toggleExpand}
        className={`flex h-10 shrink-0 items-center gap-2 bg-[#1e1e1e] px-3 text-white ${expanded ? "" : "cursor-move"}`}
      >
        <GripIcon width={16} height={16} className="opacity-70" />
        <span className="text-sm font-bold tracking-wide">{title}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={toggleExpand}
            className="rounded p-1 hover:bg-white/15"
            aria-label={expanded ? "Collapse" : "Expand"}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <CollapseIcon width={18} height={18} /> : <ExpandIcon width={18} height={18} />}
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="rounded p-1 hover:bg-white/15"
            aria-label="Close"
            title="Close"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
      {!expanded && (
        <div
          onPointerDown={(e) => begin("resize", e)}
          className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, #1e1e1e 50%, #1e1e1e 60%, transparent 60%, transparent 70%, #1e1e1e 70%, #1e1e1e 80%, transparent 80%)",
          }}
          aria-hidden
        />
      )}
    </div>
  );
}
