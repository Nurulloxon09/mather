"use client";

import { useEffect, useRef, useState } from "react";
import { FloatingPanel } from "./FloatingPanel";

// Desmos publishes a demo key for development; set NEXT_PUBLIC_DESMOS_API_KEY to use your own.
const API_KEY = process.env.NEXT_PUBLIC_DESMOS_API_KEY || "dcb31709b452b1cf9dc26972add0fda6";
const SRC = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${API_KEY}`;

type DesmosCalc = { destroy(): void; resize(): void };
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
      reject(new Error("Failed to load Desmos"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

export function Calculator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const calc = useRef<DesmosCalc | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  // Load Desmos the first time the panel opens (and retry on reopen after a failure).
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
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Keep Desmos sized to the panel while it is dragged or resized.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(() => calc.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => () => calc.current?.destroy(), []);

  return (
    <FloatingPanel
      title="Calculator"
      open={open}
      onClose={onClose}
      initial={{ x: 24, y: 96, w: 520, h: 620 }}
      minW={340}
      minH={300}
    >
      <div ref={host} className="absolute inset-0" />
      {status !== "ready" && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-bb-muted">
          {status === "error"
            ? "Couldn't load the Desmos calculator. Check your internet connection and reopen the calculator."
            : "Loading calculator…"}
        </div>
      )}
    </FloatingPanel>
  );
}
