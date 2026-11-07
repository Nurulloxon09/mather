"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader, PAGE } from "../AppHeader";
import { CheckCircle, XCircle } from "../bluebook/icons";
import { formatClock } from "../bluebook/TopBar";
import { LocalDate } from "../LocalDate";
import { Rich, RichInline } from "../Rich";
import { Segmented } from "../Segmented";
import { Meter } from "../stats/Charts";
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
type Row = { q: Question; module: number; number: number; answer?: string; correct: boolean; timeMs: number; marked: boolean };

function rowsFor(session: Session, byId: Map<string, Question>): Row[] {
  const modules: ModuleState[] = session.mode === "exam" ? session.modules : [session.module];
  return modules.flatMap((m, mi) =>
    m.questionIds.flatMap((id, i) => {
      const q = byId.get(id);
      if (!q) return [];
      const it = m.items[id];
      return [{ q, module: mi + 1, number: i + 1, answer: it?.answer, correct: isCorrect(q, it?.answer), timeMs: it?.timeMs ?? 0, marked: !!it?.marked }];
    }),
  );
}

function pct(c: number, t: number) {
  return t ? Math.round((c / t) * 100) : 0;
}

function QuestionDetail({ row }: { row: Row }) {
  const { q } = row;
  return (
    <div className="space-y-5 rounded-xl bg-bb-subtle px-4 py-5 sm:px-6">
      <Rich src={q.stem} />
      {q.type === "mcq" && (
        <ol className="space-y-2">
          {(q.choices ?? []).map((c, i) => {
            const l = LETTERS[i];
            const isAns = l === q.answer;
            const isMine = l === row.answer;
            return (
              <li
                key={l}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  isAns ? "border-bb-green bg-bb-green-soft" : isMine ? "border-bb-red bg-bb-red-soft" : "border-bb-hair bg-bb-surface"
                }`}
              >
                <span className="bb-letter">{l}</span>
                <div className="flex-1">
                  <Rich src={c} className="!text-[16px]" />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {q.flag && (
        <div className="rounded-lg bg-bb-amber-soft px-4 py-3 text-sm">
          <strong>Source issue: </strong>
          <RichInline src={q.flag} />
        </div>
      )}
      <div>
        <h4 className="mb-1 font-semibold">Explanation</h4>
        {q.explanation ? <Rich src={q.explanation} className="!text-[16px]" /> : <p className="text-sm text-bb-muted">No explanation yet.</p>}
      </div>
      <p className="text-xs text-bb-muted">
        {q.source} #{q.sourceNumber}
        {q.page ? ` · page ${q.page}` : ""} · {q.skill}
      </p>
    </div>
  );
}

export function Results({ bank, id, stored }: { bank: Question[]; id: string | null; stored: Session | null }) {
  const router = useRouter();
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  // The database copy, or this browser's copy if it hasn't been saved there yet.
  const [local, setLocal] = useState<Session | null | undefined>(undefined);
  const [open, setOpen] = useState<string | null>(null);
  const [filterChoice, setFilter] = useState<Filter | null>(null);

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
  const totalMs = rows.reduce((s, r) => s + r.timeMs, 0);
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
  // Open on the questions to look at again, if there are any.
  const filter: Filter = filterChoice ?? (wrong.length ? "wrong" : "all");
  const shown = filter === "wrong" ? wrong : filter === "marked" ? marked : rows;
  const filters: (readonly [Filter, React.ReactNode])[] = [
    ["wrong", <>Missed <span className="font-normal opacity-60">{wrong.length}</span></>],
    ["all", <>All <span className="font-normal opacity-60">{rows.length}</span></>],
  ];
  if (marked.length) filters.push(["marked", <>Marked <span className="font-normal opacity-60">{marked.length}</span></>]);
  const estimate = fullExam ? estimateScore(correct, rows.length, session.route) : null;
  const answeredRows = rows.filter((r) => r.timeMs > 0);
  const avgMs = answeredRows.length ? answeredRows.reduce((s, r) => s + r.timeMs, 0) / answeredRows.length : 0;
  const slow = rows.filter((r) => r.timeMs > PACE_MS).length;
  // The skill with the most misses here (ties: the lower accuracy) is the one to drill next.
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
      <main className={`${PAGE} space-y-12 py-6 sm:py-10`}>
        <section>
          <p className="text-sm text-bb-muted">
            {sessionLabel(session)} · <LocalDate ms={session.finishedAt} />
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-x-12 gap-y-4">
            <div>
              <p className="text-6xl font-bold leading-none tracking-tight tabular-nums">
                {correct}
                <span className="text-3xl font-semibold text-bb-muted">/{rows.length}</span>
              </p>
              <p className="mt-2 text-sm text-bb-muted">{pct(correct, rows.length)}% correct</p>
            </div>
            {estimate && (
              <div>
                <p className="text-6xl font-bold leading-none tracking-tight tabular-nums">{estimate.score}</p>
                <p className="mt-2 text-sm text-bb-muted">
                  Estimated SAT Math · {estimate.low}–{estimate.high}
                </p>
              </div>
            )}
          </div>
          <p className="mt-5 text-sm text-bb-muted">
            {fullExam &&
              modules.map((n) => {
                const rs = rows.filter((r) => r.module === n);
                return (
                  <span key={n}>
                    Module {n}
                    {n === 2 && session.route ? ` (${session.route})` : ""}: {rs.filter((r) => r.correct).length}/{rs.length}
                    {" · "}
                  </span>
                );
              })}
            {formatClock(totalMs / 1000)} on questions · {formatClock(avgMs / 1000)} each (SAT pace{" "}
            {formatClock(PACE_MS / 1000)})
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            {wrong.length > 0 && (
              <button className="bb-btn bb-btn-primary" onClick={practiceMissed}>
                Practice missed ({wrong.length})
              </button>
            )}
            {drill && (
              <Link
                href={drill}
                className="text-sm font-semibold text-bb-muted hover:text-bb-ink"
                title={`Questions in ${weakest!.s} you missed or haven't tried`}
              >
                Drill most-missed skill
              </Link>
            )}
            <Link href="/" className="text-sm font-semibold text-bb-muted hover:text-bb-ink">
              Home
            </Link>
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h2 className="flex-1 font-semibold">Questions</h2>
            <Segmented value={filter} options={filters} onChange={setFilter} label="Show questions" />
          </div>
          {shown.length === 0 ? (
            <p className="border-t border-bb-hair py-6 text-sm text-bb-muted">None.</p>
          ) : (
            <ul className="border-b border-bb-hair">
              {shown.map((r) => {
                const key = `${r.module}-${r.number}`;
                return (
                  <li key={key} className="border-t border-bb-hair">
                    <button
                      onClick={() => setOpen(open === key ? null : key)}
                      aria-expanded={open === key}
                      className="group flex min-h-11 w-full items-center gap-3 py-1.5 text-left sm:gap-4"
                    >
                      <span className={`${fullExam ? "w-12" : "w-7"} shrink-0 text-sm font-semibold tabular-nums`}>
                        {fullExam ? `M${r.module}·` : ""}
                        {r.number}
                      </span>
                      <span className="line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug group-hover:underline sm:line-clamp-1">
                        {r.q.skill}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums">
                        <span className="sr-only">Your answer: </span>
                        {r.answer ? (
                          <span
                            className={r.correct ? undefined : "text-bb-muted"}
                            dangerouslySetInnerHTML={{ __html: tex(answerTex(r.q, r.answer)) }}
                          />
                        ) : (
                          <span className="text-bb-muted">
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">blank</span>
                          </span>
                        )}
                        {!r.correct && (
                          <>
                            <span aria-hidden="true" className="mx-1.5 text-bb-muted">
                              →
                            </span>
                            <span className="sr-only">, correct: </span>
                            <span className="font-semibold" dangerouslySetInnerHTML={{ __html: tex(correctAnswerTex(r.q)) }} />
                          </>
                        )}
                      </span>
                      <span
                        className={`w-12 shrink-0 text-right text-sm tabular-nums sm:w-[5.5rem] ${
                          r.timeMs > PACE_MS ? "text-bb-amber-ink" : "text-bb-muted"
                        }`}
                        title={r.timeMs > PACE_MS ? "Slower than SAT pace" : undefined}
                      >
                        {r.timeMs > PACE_MS && (
                          <span className="mr-1.5 hidden text-[11px] font-semibold uppercase sm:inline">slow</span>
                        )}
                        {r.timeMs > PACE_MS && <span className="sr-only sm:hidden">slow, </span>}
                        {formatClock(r.timeMs / 1000)}
                      </span>
                      {r.correct ? (
                        <CheckCircle width={20} height={20} className="shrink-0 text-bb-green" role="img" aria-hidden={false} aria-label="Correct" />
                      ) : (
                        <XCircle width={20} height={20} className="shrink-0 text-bb-red" role="img" aria-hidden={false} aria-label="Incorrect" />
                      )}
                    </button>
                    {open === key && (
                      <div className="pb-4">
                        <QuestionDetail row={r} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <details className="group/more">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-bb-muted hover:text-bb-ink [&::-webkit-details-marker]:hidden">
            <span className="transition group-open/more:rotate-90">›</span> Breakdown
          </summary>
          <div className="mt-6 grid grid-cols-1 gap-12 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold">By domain</h3>
              <div className="space-y-3">
                {domains.map(({ d, c, t }) => (
                  <div key={d}>
                    <div className="mb-1.5 flex text-sm">
                      <span className="flex-1">{d}</span>
                      <span className="tabular-nums text-bb-muted">
                        {c}/{t} · {pct(c, t)}%
                      </span>
                    </div>
                    <Meter value={t ? c / t : 0} label={`${d} accuracy`} />
                  </div>
                ))}
              </div>
              {weakest && (
                <p className="mt-6 text-sm">
                  Most missed here: <strong>{weakest.s}</strong> ({weakest.t - weakest.c} of {weakest.t} wrong).
                </p>
              )}
              {slow > 0 && (
                <p className="mt-2 text-sm text-bb-muted">
                  {slow} question{slow === 1 ? "" : "s"} took longer than SAT pace ({formatClock(PACE_MS / 1000)}).
                </p>
              )}
            </div>
            <div>
              <h3 className="mb-3 font-semibold">By skill, weakest first</h3>
              <table className="w-full text-sm">
                <tbody>
                  {skills.map(({ s, c, t }) => (
                    <tr key={s} className="border-t border-bb-hair first:border-0">
                      <td className="py-2 pr-3">{s}</td>
                      <td className="whitespace-nowrap py-2 text-right tabular-nums">
                        {c}/{t}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {estimate && (
            <p className="mt-8 text-xs text-bb-muted">
              The estimate follows typical Bluebook score ranges for this raw score
              {session.mode === "exam" && session.route ? ` and the ${session.route} Module 2` : ""}. Book questions are often
              harder than the real test.
            </p>
          )}
        </details>
      </main>
    </div>
  );
}
