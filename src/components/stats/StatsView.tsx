"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle } from "../bluebook/icons";
import { formatClock } from "../bluebook/TopBar";
import { useHydrated } from "../LocalDate";
import { ChartTable, ColumnChart, LineChart, Meter, type Datum } from "./Charts";
import type { SessionSummary } from "@/lib/history";
import { computeStats, MIN_TO_RANK, PACE_MS, type AttemptRow, type Group, type Period, type QMeta } from "@/lib/stats";

const PERIODS: [Period, string][] = [
  ["all", "All time"],
  ["30d", "Last 30 days"],
  ["7d", "Last 7 days"],
];

const pct = (x: number) => `${Math.round(x * 100)}%`;
const clock = (ms: number) => formatClock(ms / 1000);
const shortDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-bb-line bg-white p-5 ${className}`}>
      <h2 className="mb-4 font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-bb-line bg-white px-5 py-4">
      <p className="text-sm font-semibold text-bb-muted">{label}</p>
      <p className="mt-1 text-[28px] font-bold leading-tight">{value}</p>
      {sub && <p className="mt-0.5 text-sm text-bb-muted">{sub}</p>}
    </div>
  );
}

function GroupRows({ groups, showTime }: { groups: Group[]; showTime?: boolean }) {
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="mb-1 flex gap-3 text-sm">
            <span className="flex-1 font-semibold">{g.key}</span>
            <span className="tabular-nums">
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
  const s = useMemo(() => computeStats(rows, meta, sessions, { period, now, bankSize }), [rows, meta, sessions, period, now, bankSize]);
  const latestExam = useMemo(() => sessions.filter((x) => x.kind === "exam").sort((a, b) => b.finishedAt - a.finishedAt), [sessions]);

  // Days and weeks are local to the viewer, so the numbers render after hydration.
  if (!hydrated) return <p className="py-10 text-bb-muted">Loading stats…</p>;

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-bb-line px-6 py-14 text-center">
        <p className="text-lg font-bold">No answers yet</p>
        <p className="mt-1 text-bb-muted">Stats appear after your first practice set or exam.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/bank" className="bb-btn bb-btn-primary">
            Practice from the bank
          </Link>
          <Link href="/" className="bb-btn bb-btn-outline">
            Take an exam
          </Link>
        </div>
      </div>
    );
  }

  const bucketLabel = (ms: number) => shortDate(ms);
  const per = s.bucket === "day" ? "day" : "week";
  const answeredData: Datum[] = s.buckets.map((b) => ({
    label: bucketLabel(b.start),
    value: b.answered,
    tip: `${b.answered} answered`,
  }));
  const accuracyData: Datum[] = s.buckets.map((b) => ({
    label: bucketLabel(b.start),
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
  const periodName = PERIODS.find((p) => p[0] === period)![1].toLowerCase();

  return (
    <div className="space-y-6">
      {/* One filter row scopes everything below it. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-bb-line bg-white p-0.5 text-sm font-semibold" role="radiogroup" aria-label="Time period">
          {PERIODS.map(([p, label]) => (
            <button
              key={p}
              role="radio"
              aria-checked={period === p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3.5 py-1.5 ${period === p ? "bg-bb-ink text-white" : "hover:bg-bb-bar"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <Link href="/history" className="text-sm font-semibold text-bb-blue hover:underline">
          See every test and set →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <section className="rounded-2xl border border-bb-line bg-white p-6">
          <p className="text-sm font-semibold text-bb-muted">Estimated SAT Math score</p>
          {latest?.estimate ? (
            <>
              <p className="mt-1 text-[56px] font-bold leading-none">{latest.estimate.score}</p>
              <p className="mt-2 text-sm">
                Range {latest.estimate.low}–{latest.estimate.high} · from your last full exam ({latest.correct}/{latest.total},{" "}
                {shortDate(latest.finishedAt)})
              </p>
              {delta !== null && (
                <p className={`mt-1 text-sm font-semibold ${delta > 0 ? "text-bb-green" : delta < 0 ? "text-bb-red" : "text-bb-muted"}`}>
                  {delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} {delta > 0 ? "+" : ""}
                  {delta} since the exam before
                </p>
              )}
              <p className="mt-3 text-xs text-bb-muted">
                An estimate from typical Bluebook score ranges. Book questions are often harder than the real test.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-[15px]">Take a full exam to get a score estimate.</p>
              <Link href="/" className="bb-btn bb-btn-primary mt-4 inline-block">
                Start an exam
              </Link>
            </>
          )}
        </section>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Tile label="Questions answered" value={s.answered.toLocaleString()} sub={periodName} />
          <Tile label="Accuracy" value={s.answered ? pct(s.accuracy) : "–"} sub={`${s.correct} correct`} />
          <Tile
            label="Time per question"
            value={s.answered ? clock(s.avgTimeMs) : "–"}
            sub={`SAT pace ${clock(PACE_MS)} · ${s.overPace} slower`}
          />
          <Tile label="Days practiced" value={String(s.daysPracticed)} sub={s.streak ? `${s.streak}-day streak` : "No current streak"} />
          <Tile label="Not tried yet" value={String(s.notTried)} sub={`of ${bankSize} in the bank`} />
          <Tile label="Full exams" value={String(s.exams.length)} sub={periodName} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={`Questions answered per ${per}`}>
          <ColumnChart data={answeredData} ariaLabel={`Questions answered per ${per}`} />
          {s.truncated && <p className="mt-1 text-xs text-bb-muted">Showing the last 26 weeks.</p>}
          <ChartTable head={[per === "day" ? "Day" : "Week of", "Answered"]} rows={s.buckets.map((b) => [bucketLabel(b.start), String(b.answered)])} />
        </Card>
        <Card title={`Accuracy per ${per}`}>
          <LineChart
            data={accuracyData}
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            format={(v) => `${v}%`}
            ariaLabel={`Accuracy per ${per}`}
          />
          <ChartTable
            head={[per === "day" ? "Day" : "Week of", "Accuracy"]}
            rows={s.buckets.map((b) => [bucketLabel(b.start), b.answered ? `${pct(b.correct / b.answered)} (${b.correct}/${b.answered})` : "–"])}
          />
        </Card>
      </div>

      <Card title="Estimated score by exam">
        {s.exams.length ? (
          <>
            <LineChart
              data={examData}
              domain={[200, 800]}
              ticks={[200, 400, 600, 800]}
              format={(v) => String(v)}
              ariaLabel="Estimated score by exam"
            />
            <ChartTable
              head={["Exam", "Estimate (raw)"]}
              rows={s.exams.map((e) => [
                `${shortDate(e.finishedAt)}${e.route ? ` · ${e.route} Module 2` : ""}`,
                `${e.estimate?.score ?? "–"} (${e.correct}/${e.total})`,
              ])}
            />
          </>
        ) : (
          <p className="text-sm text-bb-muted">No full exams {period === "all" ? "yet" : `in the ${periodName}`}.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Weakest skills">
          {s.weakest.length ? (
            <ul className="space-y-4">
              {s.weakest.map((g) => (
                <li key={g.key}>
                  <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{g.key}</p>
                      <p className="text-xs text-bb-muted">{g.domain}</p>
                    </div>
                    <span className="text-sm tabular-nums">
                      {g.correct}/{g.n} · {pct(g.accuracy)}
                    </span>
                    <Link href={practiceLink(g.key)} className="bb-btn bb-btn-outline !px-3 !py-1 text-xs">
                      Practice these
                    </Link>
                  </div>
                  <Meter value={g.accuracy} label={`${g.key} accuracy`} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-bb-muted">Answer at least {MIN_TO_RANK} questions in a skill to rank it.</p>
          )}
        </Card>
        <Card title="Accuracy by domain">
          <GroupRows groups={s.byDomain} showTime />
          <p className="mt-3 text-xs text-bb-muted">Correct / answered · accuracy · average time per question</p>
        </Card>
      </div>

      <Card title="Every skill">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-bb-muted">
              <tr>
                <th className="py-2 pr-3">Skill</th>
                <th className="py-2 pr-3 text-right">Answered</th>
                <th className="w-[34%] py-2 pr-3">Accuracy</th>
                <th className="py-2 text-right">Avg time</th>
              </tr>
            </thead>
            <tbody>
              {s.bySkill.map((g) => (
                <tr key={g.key} className="border-t border-bb-bar">
                  <td className="py-2 pr-3">
                    <Link href={practiceLink(g.key)} className="hover:text-bb-blue hover:underline">
                      {g.key}
                    </Link>
                    <span className="block text-xs text-bb-muted">{g.domain}</span>
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{g.n}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Meter value={g.accuracy} label={`${g.key} accuracy`} />
                      </div>
                      <span className="w-10 text-right tabular-nums">{pct(g.accuracy)}</span>
                    </div>
                  </td>
                  <td className={`py-2 text-right tabular-nums ${g.avgTimeMs > PACE_MS ? "font-semibold" : ""}`}>
                    {clock(g.avgTimeMs)}
                    {g.avgTimeMs > PACE_MS && <span className="ml-1 rounded bg-[#fff1cc] px-1 text-[10px] font-bold text-[#6b4b00]">SLOW</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="By difficulty">
          <GroupRows groups={s.byDifficulty} />
        </Card>
        <Card title="Practice vs tests">
          <GroupRows groups={s.byMode} showTime />
          <p className="mt-3 text-xs text-bb-muted">Tests are full exams and timed sets.</p>
        </Card>
        <Card title="Slowest questions">
          {s.slowest.length ? (
            <ul className="space-y-2 text-sm">
              {s.slowest.map((a) => {
                const m = meta[a.questionId];
                return (
                  <li key={`${a.sessionId}:${a.questionId}`}>
                    <Link href={`/results?id=${a.sessionId}`} className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-bb-bar">
                      {a.correct ? (
                        <CheckCircle width={16} height={16} className="shrink-0 text-bb-green" aria-label="Correct" />
                      ) : (
                        <XCircle width={16} height={16} className="shrink-0 text-bb-red" aria-label="Incorrect" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        #{m.number} · {m.skill}
                      </span>
                      <span className="font-semibold tabular-nums">{clock(a.timeMs)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-bb-muted">Nothing yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
