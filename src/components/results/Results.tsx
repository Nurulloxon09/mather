"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, CheckCircle2, ChevronLeft, ChevronRight, MinusCircle, X, XCircle } from "lucide-react";
import { AppHeader, PAGE } from "../AppHeader";
import { formatClock } from "../bluebook/TopBar";
import { LocalDate } from "../LocalDate";
import { Rich, RichInline } from "../Rich";
import { Segmented } from "../Segmented";
import { tex } from "@/lib/rich";
import { estimateScore } from "@/lib/score";
import { PACE_MS } from "@/lib/stats";
import {
  answerTex,
  correctAnswerTex,
  getActive,
  getSession,
  isCorrect,
  newPracticeSession,
  saveSession,
  sessionLabel,
  type ModuleState,
  type Session,
} from "@/lib/session";
import { LETTERS, type Question } from "@/lib/types";

type Filter = "all" | "wrong" | "marked";
type Row = {
  q: Question;
  module: number;
  number: number;
  answer?: string;
  correct: boolean;
  timeMs: number;
  marked: boolean;
};

function rowKey(r: Row) {
  return `${r.module}-${r.number}`;
}

function rowsFor(session: Session, byId: Map<string, Question>): Row[] {
  const modules: ModuleState[] = session.mode === "exam" ? session.modules : [session.module];
  return modules.flatMap((m, mi) =>
    m.questionIds.flatMap((id, i) => {
      const q = byId.get(id);
      if (!q) return [];
      const it = m.items[id];
      return [
        {
          q,
          module: mi + 1,
          number: i + 1,
          answer: it?.answer,
          correct: isCorrect(q, it?.answer),
          timeMs: it?.timeMs ?? 0,
          marked: !!it?.marked,
        },
      ];
    }),
  );
}

function pct(c: number, t: number) {
  return t ? Math.round((c / t) * 100) : 0;
}

function formatPace(ms: number) {
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 60) return `${sec}s`;
  return formatClock(sec);
}

function sessionHeading(s: Session) {
  if (s.mode === "practice") return s.title;
  return s.custom ?? "Full exam";
}

function ScoreRing({ percent }: { percent: number }) {
  const r = 46;
  const cx = 56;
  const cy = 56;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c * (1 - clamped / 100);
  const angle = (-90 + (clamped / 100) * 360) * (Math.PI / 180);
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy + r * Math.sin(angle);

  return (
    <div className="relative h-[112px] w-[112px] shrink-0" role="img" aria-label={`Score ${clamped}%`}>
      <svg viewBox="0 0 112 112" className="h-full w-full">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bb-hair)" strokeWidth={7} />
        {clamped > 0 && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--bb-green)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        <circle cx={dotX} cy={dotY} r={4} fill="var(--bb-ink)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none tracking-tight tabular-nums">{clamped}%</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-bb-muted">Score</span>
      </div>
    </div>
  );
}

function Inspector({
  row,
  fullExam,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
}: {
  row: Row;
  fullExam: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const { q } = row;
  const status = row.correct ? "correct" : row.answer ? "incorrect" : "skipped";
  const slow = row.timeMs > PACE_MS;

  return (
    <div className="mt-6 border-t border-bb-hair pt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm font-semibold tabular-nums">
            Question {fullExam ? `M${row.module}·` : ""}
            {row.number}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
              status === "correct" ? "text-bb-green" : status === "incorrect" ? "text-bb-red" : "text-bb-muted"
            }`}
          >
            {status === "correct" ? (
              <CheckCircle2 size={14} aria-hidden="true" />
            ) : status === "incorrect" ? (
              <XCircle size={14} aria-hidden="true" />
            ) : (
              <MinusCircle size={14} aria-hidden="true" />
            )}
            {status === "correct" ? "Correct" : status === "incorrect" ? "Incorrect" : "Skipped"}
          </span>
          <span className="text-xs text-bb-muted">{q.skill}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`mr-1 text-xs tabular-nums ${slow ? "font-semibold text-bb-amber-ink" : "text-bb-muted"}`}
            title={slow ? "Slower than SAT pace" : undefined}
          >
            {formatClock(row.timeMs / 1000)}
            {slow ? " · slow" : ""}
          </span>
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous question"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-bb-hair text-bb-muted transition hover:border-bb-line hover:text-bb-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next question"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-bb-hair text-bb-muted transition hover:border-bb-line hover:text-bb-ink disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close question details"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-bb-hair text-bb-muted transition hover:border-bb-line hover:text-bb-ink"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <Rich src={q.stem} />

        {q.type === "mcq" ? (
          <ol className="space-y-2">
            {(q.choices ?? []).map((c, i) => {
              const l = LETTERS[i];
              const isAns = l === q.answer;
              const isMine = l === row.answer;
              return (
                <li
                  key={l}
                  className={`flex items-center gap-3 rounded-lg border px-3.5 py-2.5 ${
                    isAns
                      ? "border-bb-green bg-bb-green-soft"
                      : isMine
                        ? "border-bb-red bg-bb-red-soft"
                        : "border-bb-hair bg-bb-bg/40"
                  }`}
                >
                  <span className="bb-letter">{l}</span>
                  <div className="min-w-0 flex-1">
                    <Rich src={c} className="!text-[16px]" />
                  </div>
                  {isAns && <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-bb-green">Correct</span>}
                  {!isAns && isMine && (
                    <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-bb-red">Your answer</span>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg border border-bb-hair px-4 py-3 text-sm">
            <div>
              <span className="text-bb-muted">Your answer: </span>
              {row.answer ? (
                <span className="font-semibold" dangerouslySetInnerHTML={{ __html: tex(answerTex(q, row.answer)) }} />
              ) : (
                <span className="text-bb-muted">Skipped</span>
              )}
            </div>
            <div>
              <span className="text-bb-muted">Correct answer: </span>
              <span className="font-semibold text-bb-green" dangerouslySetInnerHTML={{ __html: tex(correctAnswerTex(q)) }} />
            </div>
          </div>
        )}

        {q.flag && (
          <div className="rounded-lg bg-bb-amber-soft px-4 py-3 text-sm">
            <strong>Source issue: </strong>
            <RichInline src={q.flag} />
          </div>
        )}

        <div className="space-y-1.5 border-t border-bb-hair pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-bb-muted">Explanation</h4>
          {q.explanation ? (
            <Rich src={q.explanation} className="!text-[16px]" />
          ) : (
            <p className="text-sm text-bb-muted">No explanation yet.</p>
          )}
        </div>

        <p className="text-xs text-bb-muted">
          {q.domain} · {q.source} #{q.sourceNumber}
          {q.page ? ` · page ${q.page}` : ""}
        </p>
      </div>
    </div>
  );
}

export function Results({ bank, id, stored }: { bank: Question[]; id: string | null; stored: Session | null }) {
  const router = useRouter();
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const [local, setLocal] = useState<Session | null | undefined>(undefined);
  // undefined = initial auto-pick (first mistake if any); null = user explicitly collapsed.
  const [openKey, setOpenKey] = useState<string | null | undefined>(undefined);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage after mount
    if (!stored) setLocal(id ? (getSession(id) ?? null) : null);
  }, [id, stored]);

  const session = stored ?? local;
  if (session === undefined) return null;
  if (!session || !session.finishedAt)
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Results not found</h1>
          <Link href="/" className="bb-btn bb-btn-primary mt-6 inline-block">
            Back to home
          </Link>
        </div>
      </div>
    );

  const rows = rowsFor(session, byId);
  const correct = rows.filter((r) => r.correct).length;
  const answeredCount = rows.filter((r) => !!r.answer).length;
  const totalMs = rows.reduce((s, r) => s + r.timeMs, 0);
  const answeredRows = rows.filter((r) => r.timeMs > 0);
  const avgMs = answeredRows.length ? answeredRows.reduce((s, r) => s + r.timeMs, 0) / answeredRows.length : 0;
  const slow = rows.filter((r) => r.timeMs > PACE_MS).length;
  const scorePct = pct(correct, rows.length);

  const domains = [...new Set(rows.map((r) => r.q.domain))].map((d) => {
    const rs = rows.filter((r) => r.q.domain === d);
    return { d, c: rs.filter((r) => r.correct).length, t: rs.length };
  });
  const skills = [...new Set(rows.map((r) => r.q.skill))]
    .map((s) => {
      const rs = rows.filter((r) => r.q.skill === s);
      return { s, c: rs.filter((r) => r.correct).length, t: rs.length };
    })
    .sort((a, b) => a.c / a.t - b.c / b.t);

  const fullExam = session.mode === "exam" && !session.custom;
  const modules = fullExam ? [1, 2].filter((n) => rows.some((r) => r.module === n)) : [1];
  const wrong = rows.filter((r) => !r.correct);
  const marked = rows.filter((r) => r.marked);
  const estimate = fullExam ? estimateScore(correct, rows.length, session.route) : null;

  const shown = filter === "wrong" ? wrong : filter === "marked" ? marked : rows;
  const filters: (readonly [Filter, React.ReactNode])[] = [
    ["all", <>All <span className="font-normal opacity-60">{rows.length}</span></>],
    ["wrong", <>Missed <span className="font-normal opacity-60">{wrong.length}</span></>],
  ];
  if (marked.length) filters.push(["marked", <>Marked <span className="font-normal opacity-60">{marked.length}</span></>]);

  // Default to the first answered-wrong question (or first missed/skipped) so mistakes review opens cleanly.
  const firstMistake = rows.find((r) => !r.correct && !!r.answer) ?? wrong[0];
  const resolvedKey = openKey === undefined ? (firstMistake ? rowKey(firstMistake) : null) : openKey;
  const activeIdx = resolvedKey ? shown.findIndex((r) => rowKey(r) === resolvedKey) : -1;
  const activeRow = activeIdx >= 0 ? shown[activeIdx] : null;

  const weakest = [...skills].filter((s) => s.c < s.t).sort((a, b) => b.t - b.c - (a.t - a.c) || a.c / a.t - b.c / b.t)[0];
  const drill = weakest
    ? `/bank?${new URLSearchParams([
        ["skill", weakest.s],
        ["status", "incorrect"],
        ["status", "unanswered"],
      ])}`
    : null;

  const practiceMissed = () => {
    const active = getActive("practice");
    if (active && !confirm(`"${sessionLabel(active)}" is still in progress. Start a new set instead?`)) return;
    saveSession(newPracticeSession("Missed questions", wrong.map((r) => r.q.id)));
    router.push("/practice");
  };

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className={`${PAGE} space-y-6 py-8 sm:py-10`}>
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-bb-muted">Results</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[28px]">{sessionHeading(session)}</h1>
            <p className="mt-1 text-sm text-bb-muted tabular-nums">
              {answeredCount} of {rows.length} answered · <LocalDate ms={session.finishedAt} />
              {fullExam &&
                modules.map((n) => {
                  const rs = rows.filter((r) => r.module === n);
                  return (
                    <span key={n}>
                      {" · "}M{n}
                      {n === 2 && session.route ? ` (${session.route})` : ""}: {rs.filter((r) => r.correct).length}/{rs.length}
                    </span>
                  );
                })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {wrong.length > 0 && (
              <button
                className="bb-btn bb-btn-primary shrink-0 whitespace-nowrap !px-4 !py-2 !text-sm"
                onClick={practiceMissed}
              >
                Practice missed ({wrong.length})
              </button>
            )}
            {drill && (
              <Link
                href={drill}
                className="whitespace-nowrap text-sm font-semibold text-bb-muted hover:text-bb-ink"
                title={`Questions in ${weakest!.s} you missed or haven't tried`}
              >
                Drill most-missed skill
              </Link>
            )}
            <Link href="/" className="whitespace-nowrap text-sm font-semibold text-bb-muted hover:text-bb-ink">
              Home
            </Link>
          </div>
        </header>

        {/* KPI strip */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="self-start sm:self-center">
            <ScoreRing percent={scorePct} />
          </div>
          <div className={`grid flex-1 grid-cols-1 gap-3 ${estimate ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            <div className="rounded-xl border border-bb-hair bg-bb-surface px-5 py-4">
              <p className="text-2xl font-bold leading-tight tracking-tight tabular-nums">
                {correct} / {rows.length}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-bb-muted">Correct</p>
            </div>
            <div className="rounded-xl border border-bb-hair bg-bb-surface px-5 py-4">
              <p className="text-2xl font-bold leading-tight tracking-tight tabular-nums">{formatClock(totalMs / 1000)}</p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-bb-muted">Time spent</p>
            </div>
            <div className="rounded-xl border border-bb-hair bg-bb-surface px-5 py-4">
              <p className="text-2xl font-bold leading-tight tracking-tight tabular-nums">{formatPace(avgMs)}</p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-bb-muted">Per question</p>
            </div>
            {estimate && (
              <div className="rounded-xl border border-bb-hair bg-bb-surface px-5 py-4">
                <p className="text-2xl font-bold leading-tight tracking-tight tabular-nums">{estimate.score}</p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-bb-muted">
                  SAT Math · {estimate.low}–{estimate.high}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Questions grid + inline mistake inspector */}
        <section className="rounded-xl border border-bb-hair bg-bb-surface p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-[15px] font-semibold">Questions</h2>
              <Segmented
                value={filter}
                options={filters}
                onChange={(next) => {
                  setFilter(next);
                  setOpenKey(undefined);
                }}
                label="Filter questions"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-bb-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-bb-green" aria-hidden="true" />
                Correct
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-bb-red" aria-hidden="true" />
                Incorrect
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-[3px] border border-dashed border-bb-line" aria-hidden="true" />
                Skipped
              </span>
            </div>
          </div>

          {shown.length === 0 ? (
            <p className="py-4 text-sm text-bb-muted">No questions match this filter.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {shown.map((r) => {
                const k = rowKey(r);
                const selected = resolvedKey === k;
                const state = r.correct ? "correct" : r.answer ? "incorrect" : "skipped";
                const label = `Question ${fullExam ? `Module ${r.module} ` : ""}${r.number}: ${
                  state === "correct" ? "Correct" : state === "incorrect" ? "Incorrect" : "Skipped"
                }${r.marked ? ", marked for review" : ""}`;

                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setOpenKey(selected ? null : k)}
                    aria-expanded={selected}
                    aria-label={label}
                    className={`relative inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums transition ${
                      state === "correct"
                        ? "border border-bb-green/45 bg-bb-green-soft/75 text-bb-green hover:border-bb-green"
                        : state === "incorrect"
                          ? "border border-bb-red/55 bg-bb-red-soft/80 text-bb-red hover:border-bb-red"
                          : "border border-dashed border-bb-line bg-transparent text-bb-muted hover:border-bb-muted hover:text-bb-ink"
                    } ${selected ? "ring-2 ring-bb-ink ring-offset-2 ring-offset-bb-surface" : ""}`}
                  >
                    {fullExam ? `M${r.module}·${r.number}` : r.number}
                    {r.marked && (
                      <Bookmark
                        size={10}
                        className="absolute -right-1 -top-1 fill-bb-red text-bb-red"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeRow && (
            <Inspector
              row={activeRow}
              fullExam={fullExam}
              hasPrev={activeIdx > 0}
              hasNext={activeIdx < shown.length - 1}
              onPrev={() => setOpenKey(rowKey(shown[activeIdx - 1]))}
              onNext={() => setOpenKey(rowKey(shown[activeIdx + 1]))}
              onClose={() => setOpenKey(null)}
            />
          )}
        </section>

        {/* By skill */}
        <section className="rounded-xl border border-bb-hair bg-bb-surface p-5 sm:p-6">
          <h2 className="mb-5 text-[15px] font-semibold">By skill</h2>
          <div className="space-y-4">
            {skills.map(({ s, c, t }) => {
              const ratio = t ? (c / t) * 100 : 0;
              return (
                <div key={s} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-4 sm:grid-cols-[220px_1fr_auto]">
                  <span className="truncate text-sm text-bb-ink" title={s}>
                    {s}
                  </span>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-bb-hair"
                    role="progressbar"
                    aria-label={`${s} accuracy`}
                    aria-valuenow={Math.round(ratio)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-bb-green transition-[width] duration-300"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  <span className="min-w-[3.5ch] text-right text-sm text-bb-muted tabular-nums">
                    {c}/{t}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Secondary breakdown */}
        {(domains.length > 1 || slow > 0 || estimate) && (
          <details className="group/more rounded-xl border border-bb-hair bg-bb-surface px-5 py-4 sm:px-6">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-bb-muted hover:text-bb-ink [&::-webkit-details-marker]:hidden">
              <span className="transition group-open/more:rotate-90">›</span> Breakdown
            </summary>
            <div className="mt-5 space-y-4 border-t border-bb-hair pt-4">
              {domains.length > 1 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-bb-muted">By domain</h3>
                  {domains.map(({ d, c, t }) => {
                    const ratio = t ? (c / t) * 100 : 0;
                    return (
                      <div key={d} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-4 sm:grid-cols-[220px_1fr_auto]">
                        <span className="truncate text-sm">{d}</span>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bb-hair">
                          <div className="h-full rounded-full bg-bb-blue" style={{ width: `${ratio}%` }} />
                        </div>
                        <span className="text-right text-sm text-bb-muted tabular-nums">
                          {c}/{t} · {pct(c, t)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {weakest && (
                <p className="text-sm">
                  Most missed here: <strong>{weakest.s}</strong> ({weakest.t - weakest.c} of {weakest.t} wrong).
                </p>
              )}
              {slow > 0 && (
                <p className="text-sm text-bb-muted">
                  {slow} question{slow === 1 ? "" : "s"} took longer than SAT pace ({formatClock(PACE_MS / 1000)}).
                </p>
              )}
              {estimate && (
                <p className="text-xs text-bb-muted">
                  The estimate follows typical Bluebook score ranges for this raw score
                  {session.mode === "exam" && session.route ? ` and the ${session.route} Module 2` : ""}. Book questions are often
                  harder than the real test.
                </p>
              )}
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
