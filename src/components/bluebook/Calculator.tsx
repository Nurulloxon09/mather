"use client";

import { useEffect, useRef, useState } from "react";
import type { DesmosWay } from "@/lib/desmos";
import { DesmosWalkthrough } from "./DesmosWalkthrough";
import { CloseIcon, CollapseIcon, ExpandIcon } from "./icons";

// Desmos publishes a demo key for development; set NEXT_PUBLIC_DESMOS_API_KEY to use your own.
const API_KEY = process.env.NEXT_PUBLIC_DESMOS_API_KEY || "dcb31709b452b1cf9dc26972add0fda6";
const SRC = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${API_KEY}`;

/** The parts of the Desmos API the app uses (https://www.desmos.com/api/v1.11/docs). */
export type DesmosCalc = {
  destroy(): void;
  resize(): void;
  focusFirstExpression?(): void;
  setExpression(expr: Record<string, unknown>): void;
  removeExpression(expr: { id: string }): void;
  getExpressions(): { id?: string; type?: string; latex?: string }[];
  setBlank(): void;
  getState(): unknown;
  setState(state: unknown): void;
  setMathBounds(bounds: { left: number; right: number; bottom: number; top: number }): void;
};
type DesmosGlobal = {
  GraphingCalculator(el: HTMLElement, opts: Record<string, unknown>): DesmosCalc;
};

let loader: Promise<DesmosGlobal> | null = null;

function loadDesmos(): Promise<DesmosGlobal> {
  const w = window as unknown as { Desmos?: DesmosGlobal };
  if (w.Desmos) return Promise.resolve(w.Desmos);
  loader ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = () => (w.Desmos ? resolve(w.Desmos) : reject(new Error("Desmos missing")));
    s.onerror = () => {
      loader = null;
      s.remove();
      reject(new Error("Failed to load Desmos"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

/** Fetch Desmos in the background once a test is on screen, so the calculator opens instantly. */
export function preloadDesmos() {
  const go = () => void loadDesmos().catch(() => {});
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 3000 });
  else setTimeout(go, 1500);
}

const WIDTH_KEY = "mather:calcWidth";
const DEFAULT_W = 460;
const MIN_W = 320;
/** Room the question keeps next to the calculator. */
const KEEP_FOR_QUESTION = 380;

function maxWidth() {
  return Math.max(MIN_W, window.innerWidth - KEEP_FOR_QUESTION);
}

function savedWidth() {
  try {
    const n = Number(localStorage.getItem(WIDTH_KEY));
    if (n >= MIN_W) return n;
  } catch {
    // storage blocked
  }
  return DEFAULT_W;
}

/**
 * Desmos docked on the left of the test screen, between the top and bottom bars. The question
 * moves over instead of being covered; the right edge drags to resize (remembered), Expand makes
 * it wide. Stays mounted while closed so graphs survive between questions. Full screen on phones.
 */
export function Calculator({
  open,
  onClose,
  walkthrough,
  onWalkthroughEnd,
}: {
  open: boolean;
  onClose: () => void;
  /** A "Desmos way" to type into the calculator, with the answer to show at the end. */
  walkthrough?: { way: DesmosWay; answerLatex: string; key: number } | null;
  onWalkthroughEnd?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLElement>(null);
  const calc = useRef<DesmosCalc | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  /** The same calculator as `calc`, for rendering the walkthrough (refs can't be read in render). */
  const [instance, setInstance] = useState<DesmosCalc | null>(null);
  const [width, setWidth] = useState(DEFAULT_W);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);

  // The remembered width, once in the browser.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage after mount
    setWidth(Math.min(savedWidth(), maxWidth()));
  }, []);

  // Create Desmos the first time the panel opens (and retry on reopen after a failure).
  useEffect(() => {
    if (!open || calc.current) return;
    let cancelled = false;
    setStatus("loading");
    loadDesmos()
      .then((Desmos) => {
        if (cancelled || !host.current || calc.current) return;
        calc.current = Desmos.GraphingCalculator(host.current, {
          expressionsCollapsed: false,
          settingsMenu: true,
          zoomButtons: true,
          border: false,
          // Nothing the test doesn't need.
          images: false,
          folders: false,
          links: false,
        });
        setInstance(calc.current);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Ready to type as soon as it opens (unless a walkthrough is about to type for you).
  useEffect(() => {
    if (open && status === "ready" && !walkthrough) calc.current?.focusFirstExpression?.();
  }, [open, status, walkthrough]);

  // Keep Desmos sized to the panel.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => calc.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A smaller window shouldn't leave the question without room.
  useEffect(() => {
    const fit = () => setWidth((w) => Math.min(w, maxWidth()));
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => () => calc.current?.destroy(), []);

  const remember = (w: number) => {
    try {
      localStorage.setItem(WIDTH_KEY, String(Math.round(w)));
    } catch {
      // storage blocked
    }
  };
  const resizeTo = (w: number) => {
    const next = Math.round(Math.min(Math.max(w, MIN_W), maxWidth()));
    setWidth(next);
    return next;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (expanded) setExpanded(false);
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !panel.current) return;
    resizeTo(e.clientX - panel.current.getBoundingClientRect().left);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    remember(width);
  };

  const shown = expanded ? `max(${width}px, min(66%, calc(100% - ${KEEP_FOR_QUESTION}px)))` : `${width}px`;

  return (
    <aside
      ref={panel}
      aria-label="Calculator"
      className="relative shrink-0 flex-col border-r-2 border-[#1e1e1e] bg-white max-sm:absolute max-sm:inset-0 max-sm:z-20 max-sm:w-full! max-sm:border-r-0"
      style={{ width: shown, display: open ? "flex" : "none" }}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 bg-[#1e1e1e] pl-4 pr-2 text-white">
        <span className="text-sm font-bold tracking-wide">Calculator</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded p-1.5 hover:bg-white/15 max-sm:hidden"
            aria-label={expanded ? "Collapse" : "Expand"}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <CollapseIcon width={18} height={18} /> : <ExpandIcon width={18} height={18} />}
          </button>
          <button onClick={onClose} className="rounded p-1.5 hover:bg-white/15" aria-label="Close calculator" title="Close">
            <CloseIcon width={18} height={18} />
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={host} className="absolute inset-0" />
        {status !== "ready" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-bb-muted">
            {status === "error"
              ? "Couldn't load the Desmos calculator. Check your internet connection and reopen the calculator."
              : "Loading calculator…"}
          </div>
        )}
        {/* While resizing, keep Desmos from catching the pointer. */}
        {dragging && <div className="absolute inset-0 cursor-col-resize" />}
      </div>
      {walkthrough && status === "ready" && instance && (
        <DesmosWalkthrough
          key={walkthrough.key}
          calc={instance}
          way={walkthrough.way}
          answerLatex={walkthrough.answerLatex}
          onClose={() => onWalkthroughEnd?.()}
        />
      )}

      {/* The right edge: drag, or focus it and use the arrow keys. Double-click resets the width. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize calculator"
        aria-valuemin={MIN_W}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => remember(resizeTo(DEFAULT_W))}
        onKeyDown={(e) => {
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          e.preventDefault();
          setExpanded(false);
          remember(resizeTo(width + (e.key === "ArrowRight" ? 32 : -32)));
        }}
        className="group absolute -right-2 top-0 z-10 flex h-full w-4 cursor-col-resize touch-none justify-center outline-none max-sm:hidden"
      >
        <span
          className={`my-auto h-12 w-1.5 rounded-full transition-colors ${
            dragging ? "bg-bb-blue" : "bg-[#1e1e1e] group-hover:bg-bb-blue group-focus-visible:bg-bb-blue"
          }`}
        />
      </div>
    </aside>
  );
}
