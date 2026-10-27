"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MathDirections } from "./Directions";
import {
  CalculatorIcon,
  ChevronDown,
  ChevronUp,
  ClockIcon,
  ExitFullscreenIcon,
  FullscreenIcon,
  MoreIcon,
  ReferenceIcon,
} from "./icons";

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

function useFullscreen() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const f = () => setOn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  return [on, toggle] as const;
}

function Tool({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded px-2 py-1 text-[13px] font-semibold ${
        active ? "text-bb-blue" : "text-bb-ink hover:text-bb-blue"
      }`}
    >
      {children}
      <span className={active ? "underline decoration-2 underline-offset-4" : ""}>{label}</span>
    </button>
  );
}

export type MoreItem = { label: string; onClick: () => void };

export function TopBar({
  title,
  seconds,
  timerHidden,
  timerLocked,
  onToggleTimer,
  warning,
  calcOpen,
  onCalc,
  refOpen,
  onRef,
  moreItems,
}: {
  title: string;
  seconds: number;
  timerHidden: boolean;
  /** When true the timer can't be hidden (last 5 minutes). */
  timerLocked: boolean;
  onToggleTimer: () => void;
  warning?: string | null;
  calcOpen: boolean;
  onCalc: () => void;
  refOpen: boolean;
  onRef: () => void;
  moreItems: MoreItem[];
}) {
  const [dirOpen, setDirOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [fs, toggleFs] = useFullscreen();
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [moreOpen]);

  const showTime = !timerHidden || timerLocked;

  return (
    <header className="relative z-30 shrink-0 bg-bb-chrome">
      <div className="grid h-[72px] grid-cols-[1fr_auto_1fr] items-center px-6">
        <div className="min-w-0">
          <h1 className="truncate text-[17px] font-bold">{title}</h1>
          <button
            onClick={() => setDirOpen((v) => !v)}
            className="mt-0.5 flex items-center gap-1 text-[14px] font-semibold hover:text-bb-blue"
            aria-expanded={dirOpen}
          >
            Directions
            {dirOpen ? <ChevronUp width={16} height={16} /> : <ChevronDown width={16} height={16} />}
          </button>
        </div>

        <div className="relative flex flex-col items-center">
          {showTime ? (
            <div
              className={`text-[22px] font-bold tabular-nums leading-tight ${timerLocked ? "text-bb-red" : ""}`}
              aria-live="off"
            >
              {formatClock(seconds)}
            </div>
          ) : (
            <ClockIcon width={26} height={26} className="my-[1px]" />
          )}
          <button
            onClick={onToggleTimer}
            disabled={timerLocked}
            className="mt-0.5 rounded-full border border-[#1e1e1e] px-3 py-[1px] text-[12px] font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {showTime ? "Hide" : "Show"}
          </button>
          {warning && (
            <div
              role="alert"
              className="absolute top-full mt-3 whitespace-nowrap rounded-md bg-[#1e1e1e] px-4 py-2 text-sm font-semibold text-white shadow-lg"
            >
              {warning}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-1">
          <Tool label="Calculator" active={calcOpen} onClick={onCalc}>
            <CalculatorIcon />
          </Tool>
          <Tool label="Reference" active={refOpen} onClick={onRef}>
            <ReferenceIcon />
          </Tool>
          <Tool label={fs ? "Exit Full" : "Fullscreen"} onClick={toggleFs}>
            {fs ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </Tool>
          <div ref={moreRef} className="relative">
            <Tool label="More" active={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
              <MoreIcon />
            </Tool>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-md border border-bb-line bg-white py-1 shadow-xl">
                {moreItems.map((it) => (
                  <button
                    key={it.label}
                    onClick={() => {
                      setMoreOpen(false);
                      it.onClick();
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-bb-blue-soft"
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="bb-dash" />

      {dirOpen && (
        <>
          <div className="fixed inset-0 top-[74px] z-30 bg-black/20" onClick={() => setDirOpen(false)} />
          <div className="absolute left-6 top-[66px] z-40 w-[min(760px,calc(100vw-48px))] rounded-lg border border-[#1e1e1e] bg-white shadow-2xl">
            <div className="max-h-[70vh] overflow-auto p-6">
              <MathDirections />
            </div>
            <div className="flex justify-end border-t border-bb-line px-6 py-3">
              <button className="bb-btn bb-btn-yellow" onClick={() => setDirOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
