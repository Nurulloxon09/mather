"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from "lucide-react";
import { isPoint, pointLabel, typingFrames, type DesmosStep, type DesmosWay } from "@/lib/desmos";
import { tex } from "@/lib/rich";
import { RichInline } from "../Rich";
import type { DesmosCalc } from "./Calculator";

/** Desmos's own default colors, in its order. */
const COLORS = ["#c74440", "#2d70b3", "#388c46", "#6042a6", "#fa7e19", "#000000"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ids(i: number) {
  return [`walk${i}`, `walk${i}t`];
}

/** The expression for a step, as Desmos should show it once typed. */
function finalExpr(s: DesmosStep, i: number, latex = s.latex) {
  const point = isPoint(s.latex);
  return {
    id: ids(i)[0],
    latex,
    color: COLORS[i % COLORS.length],
    ...(point && latex === s.latex ? { showLabel: true, label: pointLabel(s.latex), dragMode: "NONE" } : {}),
  };
}

function table(s: DesmosStep, i: number, rows = Infinity) {
  return {
    type: "table",
    id: ids(i)[1],
    columns: (s.table ?? []).map((c, k) => ({
      latex: c.header,
      values: c.values.slice(0, rows),
      color: COLORS[(i + k) % COLORS.length],
    })),
  };
}

/** Puts a step's table and expression in the calculator at once. */
function placeStep(calc: DesmosCalc, s: DesmosStep, i: number) {
  if (s.table) calc.setExpression(table(s, i));
  if (s.latex) calc.setExpression(finalExpr(s, i));
}

/**
 * Plays a "Desmos way" in the real calculator: each step's expression is typed in keystroke by
 * keystroke (tables cell by cell), with a caption saying what's being typed and why. Starts on its
 * own; Back, Pause and Next step through it. What was on the calculator before can be put back.
 */
export function DesmosWalkthrough({
  calc,
  way,
  answerLatex,
  onClose,
}: {
  calc: DesmosCalc;
  way: DesmosWay;
  /** The correct answer as LaTeX, for the last caption. */
  answerLatex: string;
  onClose: () => void;
}) {
  const n = way.steps.length;
  const [cur, setCur] = useState(0);
  /** Highest step typed in full; the current one is still being typed while this is below it. */
  const [doneThrough, setDoneThrough] = useState(-1);
  const [playing, setPlaying] = useState(true);
  const [hadGraph, setHadGraph] = useState(false);
  /** Bumped to type the current step again from the start. */
  const [retype, setRetype] = useState(0);
  const saved = useRef<unknown>(null);
  const run = useRef(0);
  const instant = useRef(false);

  // Start from a clean calculator showing the right part of the graph; remember what was there.
  useEffect(() => {
    instant.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const before = calc.getExpressions().some((e) => e.latex || e.type === "table");
    if (before) saved.current = calc.getState();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from the calculator once it's ready
    setHadGraph(before);
    calc.setBlank();
    if (way.view) calc.setMathBounds(way.view);
    const token = run;
    return () => {
      token.current++;
    };
  }, [calc, way]);

  // Type the current step.
  useEffect(() => {
    if (cur >= n || doneThrough >= cur) return;
    const token = ++run.current;
    const s = way.steps[cur];
    const live = () => token === run.current;
    void (async () => {
      if (s.table) {
        const rows = Math.max(...s.table.map((c) => c.values.length));
        calc.setExpression(table(s, cur, 0));
        for (let r = 1; r <= rows && !instant.current; r++) {
          await sleep(110);
          if (!live()) return;
          calc.setExpression(table(s, cur, r));
        }
        calc.setExpression(table(s, cur));
        if (s.latex) await sleep(250);
      }
      if (s.latex) {
        const frames = instant.current ? [s.latex] : typingFrames(s.latex);
        const delay = Math.max(28, Math.min(75, 2400 / frames.length));
        for (const f of frames) {
          if (!live()) return;
          calc.setExpression(finalExpr(s, cur, f));
          await sleep(delay);
        }
        if (!live()) return;
        calc.setExpression(finalExpr(s, cur));
      }
      if (live()) setDoneThrough(cur);
    })();
  }, [cur, doneThrough, retype, n, way, calc]);

  const typing = cur < n && doneThrough < cur;

  /** Jump the current step to fully typed. */
  const finishNow = () => {
    run.current++;
    placeStep(calc, way.steps[cur], cur);
    setDoneThrough(cur);
  };
  const next = () => {
    if (typing) finishNow();
    else setCur((c) => Math.min(n, c + 1));
  };
  const back = () => {
    setPlaying(false);
    run.current++;
    if (cur >= n) {
      setCur(n - 1);
      return;
    }
    for (const id of ids(cur)) calc.removeExpression({ id });
    if (cur === 0) {
      setDoneThrough(-1);
      setRetype((r) => r + 1);
      return;
    }
    setDoneThrough(cur - 1);
    setCur(cur - 1);
  };
  const replay = () => {
    run.current++;
    calc.setBlank();
    if (way.view) calc.setMathBounds(way.view);
    setDoneThrough(-1);
    setCur(0);
    setPlaying(true);
  };

  // Playing: once a step is typed and there's been time to read it, go on.
  useEffect(() => {
    if (!playing || typing || cur >= n) return;
    const say = way.steps[cur].say;
    const t = setTimeout(() => setCur((c) => c + 1), Math.max(2200, say.length * 55));
    return () => clearTimeout(t);
  }, [playing, typing, cur, n, way]);

  const finished = cur >= n;
  const step = way.steps[Math.min(cur, n - 1)];

  return (
    <div className="shrink-0 border-t-2 border-[#1e1e1e] bg-white px-4 py-3" role="region" aria-label="The Desmos way">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-bb-blue">The Desmos way</span>
        <span className="text-xs text-bb-muted">{finished ? `${n} steps` : `Step ${cur + 1} of ${n}`}</span>
        <button
          onClick={onClose}
          className="ml-auto rounded p-1 text-bb-muted hover:bg-bb-subtle hover:text-bb-ink"
          aria-label="Close the walkthrough"
          title="Close (keeps the graph)"
        >
          <X size={16} />
        </button>
      </div>

      <div aria-live="polite" className="mt-1.5 min-h-[44px] text-[15px] leading-snug">
        {finished ? (
          <p>
            <span className="font-semibold">Answer: </span>
            <span dangerouslySetInnerHTML={{ __html: tex(answerLatex) }} />
            <span className="text-bb-muted"> · try changing a number to see the graph move.</span>
          </p>
        ) : (
          <p className={step.answerStep && !typing ? "rounded-md bg-bb-green-soft px-2 py-1 -mx-2" : undefined}>
            {step.answerStep && !typing && <span className="mr-1.5 font-semibold text-bb-green">Answer ·</span>}
            <RichInline src={step.say} />
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          onClick={back}
          disabled={cur === 0}
          className="flex items-center gap-1 rounded-full border border-bb-line px-3 py-1 text-sm font-semibold hover:bg-bb-subtle disabled:opacity-40"
        >
          <ChevronLeft size={15} aria-hidden="true" />
          Back
        </button>
        {!finished && (
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex items-center gap-1 rounded-full border border-bb-line px-3 py-1 text-sm font-semibold hover:bg-bb-subtle"
            aria-pressed={!playing}
          >
            {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {playing ? "Pause" : "Play"}
          </button>
        )}
        {finished ? (
          <button
            onClick={replay}
            className="flex items-center gap-1 rounded-full bg-bb-blue px-3 py-1 text-sm font-semibold text-white hover:bg-bb-blue-dark"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Replay
          </button>
        ) : (
          <button
            onClick={next}
            className="flex items-center gap-1 rounded-full bg-bb-blue px-3 py-1 text-sm font-semibold text-white hover:bg-bb-blue-dark"
          >
            {typing ? "Skip typing" : cur === n - 1 ? "Finish" : "Next"}
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        )}
        {hadGraph && (
          <button
            onClick={() => {
              run.current++;
              calc.setState(saved.current);
              onClose();
            }}
            className="ml-auto text-sm text-bb-muted underline-offset-2 hover:text-bb-ink hover:underline"
          >
            Restore my graph
          </button>
        )}
        <span className={`flex gap-1 ${hadGraph ? "" : "ml-auto"}`} aria-hidden="true">
          {way.steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i < cur || (i === cur && !typing && !finished) || finished ? "bg-bb-blue" : "bg-bb-line"}`}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
