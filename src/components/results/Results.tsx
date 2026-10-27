"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "../bluebook/icons";
import { formatClock } from "../bluebook/TopBar";
import { Rich, RichInline } from "../Rich";
import { tex } from "@/lib/rich";
import {
  answerTex,
  correctAnswerTex,
  getSession,
  isCorrect,
  newPracticeSession,
  saveSession,
  type ModuleState,
  type Session,
} from "@/lib/session";
import { LETTERS, type Question } from "@/lib/types";

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
    <div className="space-y-5 bg-[#fafbfe] px-6 py-5">
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
                  isAns ? "border-bb-green bg-[#e7f5ef]" : isMine ? "border-bb-red bg-[#fbeaec]" : "border-bb-line bg-white"
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
        <div className="rounded-lg border border-[#e6b800] bg-[#fff8d6] px-4 py-3 text-sm">
          <strong>Source issue: </strong>
          <RichInline src={q.flag} />
        </div>
      )}
      <div>
        <h4 className="mb-1 font-bold">Explanation</h4>
        {q.explanation ? <Rich src={q.explanation} className="!text-[16px]" /> : <p className="text-sm text-bb-muted">No explanation yet.</p>}
      </div>
      <p className="text-xs text-bb-muted">
        {q.source} #{q.sourceNumber}
        {q.page ? ` · page ${q.page}` : ""} · {q.skill}
      </p>
    </div>
  );
}

export function Results({ bank }: { bank: Question[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "wrong" | "marked">("all");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage after mount
    setSession(id ? (getSession(id) ?? null) : null);
  }, [id]);

  if (session === undefined) return null;
  if (!session)
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Results not found</h1>
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
  const modules = session.mode === "exam" ? [1, 2].filter((n) => rows.some((r) => r.module === n)) : [1];
  const shown = rows.filter((r) => (filter === "wrong" ? !r.correct : filter === "marked" ? r.marked : true));
  const wrong = rows.filter((r) => !r.correct);

  const practiceMissed = () => {
    saveSession(newPracticeSession("Missed questions", wrong.map((r) => r.q.id)));
    router.push("/practice");
  };

  return (
    <div className="min-h-dvh bg-[#f6f7fb]">
      <header className="border-b border-bb-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            mather
          </Link>
          <span className="text-sm text-bb-muted">Results</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="flex flex-wrap items-end gap-8 rounded-2xl border border-bb-line bg-white p-6">
          <div>
            <p className="text-sm font-semibold text-bb-muted">
              {session.mode === "exam" ? "Full exam" : `Practice: ${session.title}`} ·{" "}
              {new Date(session.finishedAt ?? session.createdAt).toLocaleString()}
            </p>
            <p className="mt-1 text-5xl font-extrabold">
              {correct}
              <span className="text-2xl font-bold text-bb-muted">/{rows.length}</span>
            </p>
            <p className="mt-1 font-semibold">Raw score · {pct(correct, rows.length)}% correct</p>
          </div>
          {session.mode === "exam" &&
            modules.map((n) => {
              const rs = rows.filter((r) => r.module === n);
              return (
                <div key={n}>
                  <p className="text-sm font-semibold text-bb-muted">
                    Module {n}
                    {n === 2 && session.route ? ` (${session.route})` : ""}
                  </p>
                  <p className="text-2xl font-bold">
                    {rs.filter((r) => r.correct).length}/{rs.length}
                  </p>
                </div>
              );
            })}
          <div>
            <p className="text-sm font-semibold text-bb-muted">Time on questions</p>
            <p className="text-2xl font-bold">{formatClock(totalMs / 1000)}</p>
          </div>
          <div className="ml-auto flex gap-3">
            {wrong.length > 0 && (
              <button className="bb-btn bb-btn-outline" onClick={practiceMissed}>
                Practice missed ({wrong.length})
              </button>
            )}
            <Link href="/" className="bb-btn bb-btn-primary">
              Home
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-bb-line bg-white p-6">
            <h2 className="mb-4 font-bold">Accuracy by domain</h2>
            <div className="space-y-3">
              {domains.map(({ d, c, t }) => (
                <div key={d}>
                  <div className="mb-1 flex text-sm">
                    <span className="flex-1 font-semibold">{d}</span>
                    <span>
                      {c}/{t} · {pct(c, t)}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-bb-bar">
                    <div className="h-full rounded-full bg-bb-blue" style={{ width: `${pct(c, t)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-bb-line bg-white p-6">
            <h2 className="mb-4 font-bold">By skill (weakest first)</h2>
            <table className="w-full text-sm">
              <tbody>
                {skills.map(({ s, c, t }) => (
                  <tr key={s} className="border-b border-bb-bar last:border-0">
                    <td className="py-1.5 pr-3">{s}</td>
                    <td className="whitespace-nowrap py-1.5 text-right font-semibold">
                      {c}/{t}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-bb-line bg-white">
          <div className="flex items-center gap-2 border-b border-bb-line px-6 py-4">
            <h2 className="flex-1 font-bold">Questions</h2>
            {(["all", "wrong", "marked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-sm font-semibold ${filter === f ? "bg-bb-ink text-white" : "hover:bg-bb-bar"}`}
              >
                {f === "all" ? "All" : f === "wrong" ? "Incorrect" : "Marked"}
              </button>
            ))}
          </div>
          <table className="w-full text-[15px]">
            <thead className="bg-bb-bar text-left text-xs uppercase tracking-wide text-bb-muted">
              <tr>
                <th className="px-6 py-2">#</th>
                <th className="py-2">Skill</th>
                <th className="py-2">Yours</th>
                <th className="py-2">Correct</th>
                <th className="py-2">Time</th>
                <th className="py-2 pr-6" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const key = `${r.module}-${r.number}`;
                return (
                  <Fragment key={key}>
                    <tr
                      onClick={() => setOpen(open === key ? null : key)}
                      className="cursor-pointer border-t border-bb-bar hover:bg-[#f7f8fc]"
                    >
                      <td className="whitespace-nowrap px-6 py-3 font-bold">
                        {session.mode === "exam" ? `M${r.module}·` : ""}
                        {r.number}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="text-sm">{r.q.skill}</div>
                        <div className="text-xs text-bb-muted">
                          {r.q.domain} · {r.q.difficulty}
                        </div>
                      </td>
                      <td className="py-3">
                        {r.answer ? (
                          <span dangerouslySetInnerHTML={{ __html: tex(answerTex(r.q, r.answer)) }} />
                        ) : (
                          <span className="text-bb-muted">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span dangerouslySetInnerHTML={{ __html: tex(correctAnswerTex(r.q)) }} />
                      </td>
                      <td className="py-3 tabular-nums">{formatClock(r.timeMs / 1000)}</td>
                      <td className="py-3 pr-6">
                        {r.correct ? (
                          <CheckCircle width={22} height={22} className="text-bb-green" />
                        ) : (
                          <XCircle width={22} height={22} className="text-bb-red" />
                        )}
                      </td>
                    </tr>
                    {open === key && (
                      <tr>
                        <td colSpan={6} className="border-t border-bb-bar p-0">
                          <QuestionDetail row={r} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
