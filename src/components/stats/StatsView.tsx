"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle } from "../bluebook/icons";
import { formatClock } from "../bluebook/TopBar";
import { useHydrated } from "../LocalDate";
import { Segmented } from "../Segmented";
import { ChartTable, ColumnChart, LineChart, Meter, type Datum } from "./Charts";
import type { SessionSummary } from "@/lib/history";
import { computeStats, MIN_TO_RANK, PACE_MS, type AttemptRow, type Group, type Period, type QMeta } from "@/lib/stats";

const PERIODS = [
  ["all", "All time"],
  ["30d", "30 days"],
  ["7d", "7 days"],
] as const satisfies readonly (readonly [Period, string])[];

type Metric = "accuracy" | "answered" | "score";
const METRICS = [
  ["accuracy", "Accuracy"],
  ["answered", "Answered"],
  ["score", "Score"],
] as const satisfies readonly (readonly [Metric, string])[];

const pct = (x: number) => `${Math.round(x * 100)}%`;
const clock = (ms: number) => formatClock(ms / 1000);
const shortDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Figure({ value, label, sub }: { value: string; label: string; sub?: React.ReactNode }) {
  return (
    <div>
      <p className="text-3xl font-bold tabular-nums sm:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-bb-muted">{label}</p>
      {sub && <p className="text-xs text-bb-muted">{sub}</p>}
    </div>
  );
}

function GroupRows({ groups, showTime }: { groups: Group[]; showTime?: boolean }) {
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="mb-1.5 flex gap-3 text-sm">
            <span className="flex-1">{g.key}</span>
            <span className="tabular-nums text-bb-muted">
              {g.correct}/{g.n} · {pct(g.accuracy)}
              {showTime ? ` · ${clock(g.avgTimeMs)}` : ""}
            </span>
          </div>
          <Meter value={g.accuracy} label={`${g.key} accuracy`} />
        </div>
      ))}
    </div>
  );
}

const practiceLink = (skill: string) => {
  const p = new URLSearchParams();
  p.append("skill", skill);
  p.append("status", "incorrect");
  p.append("status", "unanswered");
  return `/bank?${p}`;
};

export function StatsView({
  rows,
  meta,
  sessions,
  bankSize,
  now,
}: {
  rows: AttemptRow[];
  meta: Record<string, QMeta>;
  sessions: SessionSummary[];
  bankSize: number;
  now: number;
}) {
  const hydrated = useHydrated();
  const [period, setPeriod] = useState<Period>("all");
  const [metric, setMetric] = useState<Metric>("accuracy");
  const s = useMemo(() => computeStats(rows, meta, sessions, { period, now, bankSize }), [rows, meta, sessions, period, now, bankSize]);
  const latestExam = useMemo(() => sessions.filter((x) => x.kind === "exam").sort((a, b) => b.finishedAt - a.finishedAt), [sessions]);

  // Days and weeks are local to the viewer, so the numbers render after hydration.
  if (!hydrated) return <p className="py-10 text-bb-muted">Loading stats…</p>;

  if (!rows.length) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold">No answers yet</p>
        <p className="mt-1 text-bb-muted">Stats appear after your first practice set or exam.</p>
        <div className="mt-6 flex items-center justify-center gap-6">
          <Link href="/bank" className="bb-btn bb-btn-primary">
            Practice
          </Link>
          <Link href="/" className="text-sm font-semibold text-bb-muted hover:text-bb-ink">
            Take an exam
          </Link>
        </div>
      </div>
    );
  }

  const per = s.bucket === "day" ? "day" : "week";
  const answeredData: Datum[] = s.buckets.map((b) => ({
    label: shortDate(b.start),
    value: b.answered,
    tip: `${b.answered} answered`,
  }));
  const accuracyData: Datum[] = s.buckets.map((b) => ({
    label: shortDate(b.start),
    value: b.answered ? Math.round((b.correct / b.answered) * 100) : null,
    tip: b.answered ? `${pct(b.correct / b.answered)} (${b.correct}/${b.answered})` : "No answers",
  }));
  const examData: Datum[] = s.exams.map((e) => ({
    label: shortDate(e.finishedAt),
    value: e.estimate?.score ?? null,
    tip: `≈ ${e.estimate?.score} · ${e.correct}/${e.total} correct${e.route ? ` · ${e.route} Module 2` : ""}`,
  }));

  const latest = latestExam[0];
  const previous = latestExam[1];
  const delta = latest?.estimate && previous?.estimate ? latest.estimate.score - previous.estimate.score : null;
  const periodName = period === "all" ? "all time" : `the last ${PERIODS.find((p) => p[0] === period)![1]}`;
  const bucketHead = per === "day" ? "Day" : "Week of";

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={period} options={PERIODS} onChange={setPeriod} label="Time period" />
      </div>

      {/* The headline: score estimate, then three numbers. */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] sm:items-end">
        <div>
          {latest?.estimate ? (
            <>
              <p className="text-6xl font-bold leading-none tracking-tight tabular-nums">{latest.estimate.score}</p>
              <p className="mt-2 text-sm text-bb-muted">
                Estimated SAT Math score · {latest.estimate.low}–{latest.estimate.high}
              </p>
              {delta !== null && (
                <p className={`text-sm font-semibold ${delta > 0 ? "text-bb-green" : delta < 0 ? "text-bb-red" : "text-bb-muted"}`}>
                  {delta > 0 ? "▲ +" : delta < 0 ? "▼ " : "■ "}
                  {delta} since the exam before
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-6xl font-bold leading-none text-bb-faint">–</p>
              <p className="mt-2 text-sm text-bb-muted">
                Estimated SAT Math score.{" "}
                <Link href="/" className="text-bb-link hover:underline">
                  Take a full exam
                </Link>{" "}
                to get one.
              </p>
            </>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Figure value={s.answered.toLocaleString()} label="Answered" />
          <Figure value={s.answered ? pct(s.accuracy) : "–"} label="Accuracy" />
          <Figure
            value={s.answered ? clock(s.avgTimeMs) : "–"}
            label="Per question"
            sub={`SAT pace ${clock(PACE_MS)}`}
          />
        </div>
      </div>

      {/* One chart; the switch picks what it shows. */}
      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Segmented value={metric} options={METRICS} onChange={setMetric} label="Chart" />
          <span className="text-sm text-bb-muted">{metric === "score" ? "per full exam" : `per ${per}`}</span>
        </div>
        {metric === "accuracy" && (
          <>
            <LineChart data={accuracyData} domain={[0, 100]} ticks={[0, 50, 100]} format={(v) => `${v}%`} ariaLabel={`Accuracy per ${per}`} />
            <ChartTable
              head={[bucketHead, "Accuracy"]}
              rows={s.buckets.map((b) => [shortDate(b.start), b.answered ? `${pct(b.correct / b.answered)} (${b.correct}/${b.answered})` : "–"])}
            />
          </>
        )}
        {metric === "answered" && (
          <>
            <ColumnChart data={answeredData} ariaLabel={`Questions answered per ${per}`} />
            <ChartTable head={[bucketHead, "Answered"]} rows={s.buckets.map((b) => [shortDate(b.start), String(b.answered)])} />
          </>
        )}
        {metric === "score" &&
          (s.exams.length ? (
            <>
              <LineChart data={examData} domain={[200, 800]} ticks={[200, 400, 600, 800]} format={(v) => String(v)} ariaLabel="Estimated score by exam" />
              <ChartTable
                head={["Exam", "Estimate (raw)"]}
                rows={s.exams.map((e) => [
                  `${shortDate(e.finishedAt)}${e.route ? ` · ${e.route} Module 2` : ""}`,
                  `${e.estimate?.score ?? "–"} (${e.correct}/${e.total})`,
                ])}
              />
            </>
          ) : (
            <p className="grid h-[190px] place-items-center text-sm text-bb-muted">No full exams in {periodName}.</p>
          ))}
        {s.truncated && metric !== "score" && <p className="mt-1 text-xs text-bb-muted">Showing the last 26 weeks.</p>}
      </section>

      <Section title="Weakest skills">
        {s.weakest.length ? (
          <ul className="divide-y divide-bb-hair border-y border-bb-hair">
            {s.weakest.map((g) => (
              <li key={g.key} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="leading-snug">{g.key}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="max-w-56 flex-1">
                      <Meter value={g.accuracy} label={`${g.key} accuracy`} />
                    </div>
                    <span className="text-sm tabular-nums text-bb-muted">
                      {pct(g.accuracy)} · {g.correct}/{g.n}
                    </span>
                  </div>
                </div>
                <Link href={practiceLink(g.key)} aria-label={`Practice ${g.key}`} className="text-sm font-semibold text-bb-link hover:underline">
                  Practice
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-bb-muted">Answer at least {MIN_TO_RANK} questions in a skill to rank it.</p>
        )}
      </Section>

      <details className="group/more">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-bb-muted hover:text-bb-ink [&::-webkit-details-marker]:hidden">
          <span className="transition group-open/more:rotate-90">›</span> More detail
        </summary>
        <div className="mt-8 space-y-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Figure value={String(s.daysPracticed)} label="Days practiced" sub={s.streak ? `${s.streak}-day streak` : "No current streak"} />
            <Figure value={String(s.notTried)} label="Not tried yet" sub={`of ${bankSize} in the bank`} />
            <Figure value={String(s.exams.length)} label="Full exams" />
            <Figure value={String(s.overPace)} label="Slower than pace" sub={`over ${clock(PACE_MS)}`} />
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <Section title="By domain">
              <GroupRows groups={s.byDomain} showTime />
              <p className="mt-3 text-xs text-bb-muted">Correct / answered · accuracy · time per question</p>
            </Section>
            <Section title="Practice vs tests">
              <GroupRows groups={s.byMode} showTime />
              <p className="mt-3 text-xs text-bb-muted">Tests are full exams and timed sets.</p>
            </Section>
          </div>

          <Section title="Every skill">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-xs text-bb-muted">
                  <tr>
                    <th className="py-2 pr-3 font-normal">Skill</th>
                    <th className="py-2 pr-3 text-right font-normal">Answered</th>
                    <th className="w-[34%] py-2 pr-3 font-normal">Accuracy</th>
                    <th className="py-2 text-right font-normal">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {s.bySkill.map((g) => (
                    <tr key={g.key} className="border-t border-bb-hair">
                      <td className="py-2.5 pr-3">
                        <Link href={practiceLink(g.key)} className="hover:underline">
                          {g.key}
                        </Link>
                        <span className="block text-xs text-bb-muted">{g.domain}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{g.n}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Meter value={g.accuracy} label={`${g.key} accuracy`} />
                          </div>
                          <span className="w-10 text-right tabular-nums">{pct(g.accuracy)}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right tabular-nums">
                        {clock(g.avgTimeMs)}
                        {g.avgTimeMs > PACE_MS && <span className="ml-1.5 text-xs font-semibold text-bb-amber-ink">slow</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {s.byDifficulty.length > 1 && (
              <Section title="By difficulty">
                <GroupRows groups={s.byDifficulty} />
              </Section>
            )}
            <Section title="Slowest questions">
              {s.slowest.length ? (
                <ul className="space-y-1 text-sm">
                  {s.slowest.map((a) => {
                    const m = meta[a.questionId];
                    return (
                      <li key={`${a.sessionId}:${a.questionId}`}>
                        <Link href={`/results?id=${a.sessionId}`} className="group flex items-center gap-2 py-1">
                          {a.correct ? (
                            <CheckCircle width={16} height={16} className="shrink-0 text-bb-green" aria-label="Correct" />
                          ) : (
                            <XCircle width={16} height={16} className="shrink-0 text-bb-red" aria-label="Incorrect" />
                          )}
                          <span className="min-w-0 flex-1 truncate group-hover:underline">
                            #{m.number} · {m.skill}
                          </span>
                          <span className="tabular-nums text-bb-muted">{clock(a.timeMs)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-bb-muted">Nothing yet.</p>
              )}
            </Section>
          </div>

          <p className="text-xs text-bb-muted">
            The score estimate comes from your latest full exam ({latest ? `${latest.correct}/${latest.total}, ${shortDate(latest.finishedAt)}` : "none yet"})
            and typical Bluebook score ranges. Book questions are often harder than the real test.
          </p>
        </div>
      </details>
    </div>
  );
}
