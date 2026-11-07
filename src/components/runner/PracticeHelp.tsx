"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { ChartSpline, Lightbulb, MessageCircleQuestion } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import type { DesmosWay } from "@/lib/desmos";
import { correctAnswerTex, isCorrect } from "@/lib/session";
import type { ItemState, Question } from "@/lib/types";
import { Rich } from "../Rich";
import { useDesmosHelp } from "./TestShell";

// AI help while practicing, fetched once per question (the server keeps it too) and shared by
// the question area and the result popup through this small store.

type Kind = "hints" | "wrong" | "desmos";
type Entry = { status: "loading" | "done" | "error"; data?: unknown; error?: string; promise?: Promise<unknown> };

const entries = new Map<string, Entry>();
const hintsShown = new Map<string, number>();
const listeners = new Set<() => void>();
let version = 0;

function changed() {
  version++;
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
const keyOf = (qid: string, kind: Kind, answer = "") => `${kind}:${qid}:${answer}`;

function message(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 429)
      return `AI help is busy right now${err.retryAfter ? `. Try again in ${err.retryAfter} s` : ""}.`;
    return err.message;
  }
  return "Couldn't get help right now. Try again.";
}

/** Asks for help once; later calls get the same answer. */
function load<T>(qid: string, kind: Kind, answer = ""): Promise<T> {
  const key = keyOf(qid, kind, answer);
  const e = entries.get(key);
  // A walkthrough that couldn't be checked is asked for again.
  if (e?.status === "done" && !(e.data as { unverified?: boolean }).unverified) return Promise.resolve(e.data as T);
  if (e?.status === "loading" && e.promise) return e.promise as Promise<T>;
  const promise = api.help<T>(qid, { kind, answer: answer || undefined }).then(
    (data) => {
      entries.set(key, { status: "done", data });
      changed();
      return data;
    },
    (err) => {
      entries.set(key, { status: "error", error: message(err) });
      changed();
      throw err;
    },
  );
  entries.set(key, { status: "loading", promise });
  changed();
  return promise;
}

function useEntry(qid: string, kind: Kind, answer = "") {
  // The version makes each change a new snapshot; the entry itself is read alongside.
  useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
  return entries.get(keyOf(qid, kind, answer));
}

function useHintsShown(qid: string) {
  useSyncExternalStore(
    subscribe,
    () => version,
    () => 0,
  );
  return hintsShown.get(qid) ?? 0;
}

const pill =
  "inline-flex items-center gap-1.5 rounded-full border border-bb-line bg-bb-surface px-3.5 py-1.5 text-sm font-semibold hover:bg-bb-subtle disabled:cursor-wait disabled:opacity-60";

/** The hints asked for so far, then a button for the next one (while the question is open). */
function Hints({ q, canAsk }: { q: Question; canAsk: boolean }) {
  const entry = useEntry(q.id, "hints");
  const shown = useHintsShown(q.id);
  const hints = (entry?.data as { hints?: string[] } | undefined)?.hints ?? [];
  const visible = hints.slice(0, shown);
  const more = canAsk && (shown === 0 || shown < hints.length);
  const last = useRef<HTMLDivElement>(null);
  const seen = useRef(shown);

  // Bring a newly revealed hint into view (it can land below the fold on a phone).
  useEffect(() => {
    if (shown > seen.current) last.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    seen.current = shown;
  }, [shown]);

  const ask = async () => {
    try {
      const { hints: all } = await load<{ hints: string[] }>(q.id, "hints");
      hintsShown.set(q.id, Math.min(all.length, (hintsShown.get(q.id) ?? 0) + 1));
      changed();
    } catch {
      // shown from the store
    }
  };

  if (!visible.length && !more) return null;
  return (
    <div className="space-y-2">
      {visible.map((h, i) => (
        <div key={i} ref={i === visible.length - 1 ? last : undefined} className="flex gap-3 rounded-lg border border-bb-hair bg-bb-subtle px-4 py-3">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-bb-amber-ink" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-bb-muted">
              Hint {i + 1} of {hints.length}
            </p>
            <Rich src={h} className="!text-[16px]" />
          </div>
        </div>
      ))}
      {more && (
        <button className={pill} onClick={ask} disabled={entry?.status === "loading"}>
          <Lightbulb size={15} aria-hidden="true" />
          {entry?.status === "loading"
            ? "Thinking of a hint…"
            : shown === 0
              ? "Hint"
              : `Another hint (${shown + 1} of ${hints.length})`}
        </button>
      )}
      {entry?.status === "error" && <p className="text-sm text-bb-red">{entry.error}</p>}
    </div>
  );
}

/** "Why is my answer wrong?" and its answer. */
export function WhyWrong({ q, answer }: { q: Question; answer: string }) {
  const entry = useEntry(q.id, "wrong", answer);
  const text = (entry?.data as { explanation?: string } | undefined)?.explanation;
  if (text) {
    return (
      <div className="rounded-lg border border-bb-hair bg-bb-red-soft/50 px-4 py-3">
        <h3 className="mb-1 text-[15px] font-bold">Why your answer is wrong</h3>
        <Rich src={text} className="!text-[16px]" />
      </div>
    );
  }
  return (
    <div>
      <button
        className={pill}
        onClick={() => void load(q.id, "wrong", answer).catch(() => {})}
        disabled={entry?.status === "loading"}
      >
        <MessageCircleQuestion size={15} aria-hidden="true" />
        {entry?.status === "loading" ? "Looking at your answer…" : "Why is my answer wrong?"}
      </button>
      {entry?.status === "error" && <p className="mt-2 text-sm text-bb-red">{entry.error}</p>}
    </div>
  );
}

/** Opens the calculator and types the Desmos route to the answer into it. */
export function DesmosButton({
  q,
  onStart,
  className = pill,
}: {
  q: Question;
  onStart?: () => void;
  className?: string;
}) {
  const desmos = useDesmosHelp();
  const entry = useEntry(q.id, "desmos");
  const way = entry?.data as DesmosWay | undefined;
  if (!desmos) return null;
  const go = async () => {
    try {
      const w = await load<DesmosWay>(q.id, "desmos");
      if (!w.useful) return;
      onStart?.();
      desmos.play(w, correctAnswerTex(q));
    } catch {
      // shown from the store
    }
  };
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button className={className} onClick={go} disabled={entry?.status === "loading"}>
        <ChartSpline size={15} aria-hidden="true" />
        {entry?.status === "loading" ? "Writing the Desmos steps…" : "Show the Desmos way"}
      </button>
      {way && !way.useful && (
        <span className="text-sm text-bb-muted">
          {way.unverified
            ? "Couldn't build Desmos steps that reach the right answer this time. Try again later."
            : "Desmos doesn't make this one faster; the explanation is the better route."}
        </span>
      )}
      {entry?.status === "error" && <span className="text-sm text-bb-red">{entry.error}</span>}
    </span>
  );
}

/** Help under the question: hints while it's open; the Desmos way and "why wrong" once checked. */
export function PracticeHelp({ q, item }: { q: Question; item: ItemState }) {
  const checked = !!item.checked;
  const wrong = checked && !!item.answer && !isCorrect(q, item.answer);
  return (
    <div className="mt-8 space-y-3 border-t border-bb-hair pt-5">
      <Hints q={q} canAsk={!checked} />
      {checked && (
        <div className="flex flex-wrap items-start gap-3">
          <DesmosButton q={q} />
        </div>
      )}
      {wrong && <WhyWrong q={q} answer={item.answer!} />}
    </div>
  );
}
