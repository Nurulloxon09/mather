"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { BottomBar } from "../bluebook/BottomBar";
import { Calculator, preloadDesmos } from "../bluebook/Calculator";
import type { GridCell } from "../bluebook/QuestionGrid";
import { ReferenceSheet } from "../bluebook/ReferenceSheet";
import { Scratchpad, type ScratchStroke } from "../bluebook/Scratchpad";
import { TopBar, type MoreItem } from "../bluebook/TopBar";
import type { DesmosWay } from "@/lib/desmos";

type DesmosHelp = {
  /** Opens the calculator and types the walkthrough into it. */
  play: (way: DesmosWay, answerLatex: string) => void;
};

const DesmosHelpContext = createContext<DesmosHelp | null>(null);

/** For the question area: plays a "Desmos way" in the test's calculator. */
export function useDesmosHelp() {
  return useContext(DesmosHelpContext);
}

/** Bluebook frame: top bar, scrollable body, bottom bar and the floating tools. */
export function TestShell({
  title,
  navTitle,
  name,
  seconds,
  timerHidden,
  timerLocked,
  timerLabel,
  timerTone,
  onToggleTimer,
  warning,
  moreItems,
  index,
  total,
  cells,
  onJump,
  onReviewPage,
  showNav,
  isMath = true,
  scratchKey,
  buttons,
  children,
}: {
  title: string;
  navTitle: string;
  name: string;
  seconds: number;
  timerHidden: boolean;
  timerLocked: boolean;
  timerLabel?: string;
  timerTone?: "normal" | "warning" | "danger";
  onToggleTimer: () => void;
  warning?: string | null;
  moreItems: MoreItem[];
  index: number;
  total: number;
  cells: GridCell[];
  onJump: (i: number) => void;
  onReviewPage?: () => void;
  showNav?: boolean;
  isMath?: boolean;
  scratchKey?: string;
  buttons: ReactNode;
  children: ReactNode;
}) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [scratchOpen, setScratchOpen] = useState(false);
  const [strokesByKey, setStrokesByKey] = useState<Record<string, ScratchStroke[]>>({});
  const [walkthrough, setWalkthrough] = useState<{ way: DesmosWay; answerLatex: string; key: number } | null>(null);

  useEffect(() => {
    if (isMath) preloadDesmos();
  }, [isMath]);

  const play = useCallback((way: DesmosWay, answerLatex: string) => {
    setWalkthrough((w) => ({ way, answerLatex, key: (w?.key ?? 0) + 1 }));
    setCalcOpen(true);
  }, []);
  const desmosHelp = useMemo(() => (isMath ? { play } : null), [isMath, play]);
  const closeCalc = () => {
    setCalcOpen(false);
    setWalkthrough(null);
  };

  const activeScratchKey = scratchKey ?? String(index);
  const activeStrokes = strokesByKey[activeScratchKey] ?? [];
  const updateStrokes = useCallback(
    (next: ScratchStroke[]) => {
      setStrokesByKey((prev) => ({ ...prev, [activeScratchKey]: next }));
    },
    [activeScratchKey],
  );

  return (
    <div className="bb-light flex h-dvh flex-col overflow-hidden bg-white">
      <TopBar
        title={title}
        seconds={seconds}
        timerHidden={timerHidden}
        timerLocked={timerLocked}
        timerLabel={timerLabel}
        timerTone={timerTone}
        onToggleTimer={onToggleTimer}
        warning={warning}
        calcOpen={calcOpen}
        onCalc={() => (calcOpen ? closeCalc() : setCalcOpen(true))}
        refOpen={refOpen}
        onRef={() => setRefOpen((v) => !v)}
        scratchOpen={scratchOpen}
        onScratch={() => setScratchOpen((v) => !v)}
        moreItems={moreItems}
        isMath={isMath}
      />
      {/* The calculator docks on the left and the question moves over, so neither covers the other. */}
      <div className="relative flex min-h-0 flex-1">
        {isMath && (
          <Calculator
            open={calcOpen}
            onClose={closeCalc}
            walkthrough={walkthrough}
            onWalkthroughEnd={() => setWalkthrough(null)}
          />
        )}
        <main className="relative min-h-0 min-w-0 flex-1">
          <DesmosHelpContext.Provider value={desmosHelp}>{children}</DesmosHelpContext.Provider>
          <Scratchpad
            open={scratchOpen}
            strokes={activeStrokes}
            onChange={updateStrokes}
            onClose={() => setScratchOpen(false)}
          />
        </main>
      </div>
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
      {isMath && <ReferenceSheet open={refOpen} onClose={() => setRefOpen(false)} />}
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
