"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BottomBar } from "../bluebook/BottomBar";
import { Calculator } from "../bluebook/Calculator";
import type { GridCell } from "../bluebook/QuestionGrid";
import { ReferenceSheet } from "../bluebook/ReferenceSheet";
import { TopBar, type MoreItem } from "../bluebook/TopBar";

/** Bluebook frame: top bar, scrollable body, bottom bar and the floating tools. */
export function TestShell({
  title,
  navTitle,
  name,
  seconds,
  timerHidden,
  timerLocked,
  onToggleTimer,
  warning,
  moreItems,
  index,
  total,
  cells,
  onJump,
  onReviewPage,
  showNav,
  buttons,
  children,
}: {
  title: string;
  navTitle: string;
  name: string;
  seconds: number;
  timerHidden: boolean;
  timerLocked: boolean;
  onToggleTimer: () => void;
  warning?: string | null;
  moreItems: MoreItem[];
  index: number;
  total: number;
  cells: GridCell[];
  onJump: (i: number) => void;
  onReviewPage?: () => void;
  showNav?: boolean;
  buttons: ReactNode;
  children: ReactNode;
}) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <TopBar
        title={title}
        seconds={seconds}
        timerHidden={timerHidden}
        timerLocked={timerLocked}
        onToggleTimer={onToggleTimer}
        warning={warning}
        calcOpen={calcOpen}
        onCalc={() => setCalcOpen((v) => !v)}
        refOpen={refOpen}
        onRef={() => setRefOpen((v) => !v)}
        moreItems={moreItems}
      />
      <main className="relative min-h-0 flex-1">{children}</main>
      <BottomBar
        name={name}
        title={navTitle}
        index={index}
        total={total}
        cells={cells}
        onJump={onJump}
        onReviewPage={onReviewPage}
        showNav={showNav}
      >
        {buttons}
      </BottomBar>
      <Calculator open={calcOpen} onClose={() => setCalcOpen(false)} />
      <ReferenceSheet open={refOpen} onClose={() => setRefOpen(false)} />
    </div>
  );
}

export function CenterMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="mt-3 text-bb-muted">{children}</div>
        <Link href="/" className="bb-btn bb-btn-primary mt-6 inline-block">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export function Modal({
  children,
  onClose,
  width = 560,
}: {
  children: ReactNode;
  onClose?: () => void;
  width?: number;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        className="max-h-[90vh] w-full overflow-auto rounded-xl border border-[#1e1e1e] bg-white shadow-2xl"
        style={{ maxWidth: width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
