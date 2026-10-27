"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, CloseIcon } from "./icons";
import { Legend, QuestionGrid, type GridCell } from "./QuestionGrid";

export function BottomBar({
  name,
  title,
  index,
  total,
  cells,
  onJump,
  onReviewPage,
  showNav = true,
  children,
}: {
  name: string;
  /** e.g. "Section 2, Module 1: Math Questions" */
  title: string;
  index: number;
  total: number;
  cells: GridCell[];
  onJump: (i: number) => void;
  onReviewPage?: () => void;
  showNav?: boolean;
  /** Right-side buttons (Back / Next / Check). */
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <footer className="relative z-30 shrink-0 bg-bb-chrome">
      <div className="bb-dash" />
      <div className="grid h-[68px] grid-cols-[1fr_auto_1fr] items-center px-6">
        <div className="truncate text-[16px] font-bold">{name}</div>
        <div ref={box} className="relative flex justify-center">
          {showNav && (
            <button
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="flex items-center gap-1.5 rounded-md bg-[#1e1e1e] px-4 py-2 text-[15px] font-bold text-white hover:bg-[#333]"
            >
              Question {index + 1} of {total}
              {open ? <ChevronDown width={18} height={18} /> : <ChevronUp width={18} height={18} />}
            </button>
          )}
          {open && (
            <div className="absolute bottom-full mb-4 w-[min(560px,calc(100vw-32px))] rounded-xl border border-[#1e1e1e] bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
              <div className="mb-3 flex items-center">
                <h2 className="flex-1 text-center text-[16px] font-bold">{title}</h2>
                <button onClick={() => setOpen(false)} aria-label="Close" className="rounded p-1 hover:bg-bb-bar">
                  <CloseIcon width={20} height={20} />
                </button>
              </div>
              <div className="border-y border-bb-line py-3">
                <Legend />
              </div>
              <div className="max-h-[50vh] overflow-auto py-5">
                <QuestionGrid
                  cells={cells}
                  current={index}
                  onPick={(i) => {
                    setOpen(false);
                    onJump(i);
                  }}
                />
              </div>
              {onReviewPage && (
                <div className="flex justify-center">
                  <button
                    className="bb-btn bb-btn-outline !border-bb-blue !text-bb-blue"
                    onClick={() => {
                      setOpen(false);
                      onReviewPage();
                    }}
                  >
                    Go to Review Page
                  </button>
                </div>
              )}
              <div className="absolute -bottom-[9px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-[#1e1e1e] bg-white" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3">{children}</div>
      </div>
    </footer>
  );
}
