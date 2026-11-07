"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Pencil, RotateCcw, Target } from "lucide-react";
import { localGoal, newerGoal, storeGoal } from "@/lib/client/goal";
import type { SessionSummary } from "@/lib/history";
import { mergeSessions } from "@/lib/history";
import { answeredToday, daysUntil, DEFAULT_DAILY, skillLink, suggestSkills, type Goal } from "@/lib/plan";
import { REVIEW_DAYS, reviewQueue } from "@/lib/review";
import { listFinished, type Session } from "@/lib/session";
import type { ProgressMap } from "@/lib/attempts";
import type { Question } from "@/lib/types";
import { useProgress } from "@/lib/useProgress";

/** Questions in one review set; the rest wait for the next one. */
const REVIEW_SET = 25;

function Ring({ value, goal }: { value: number; goal: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const done = Math.min(1, goal ? value / goal : 0);
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      role="img"
      aria-label={`${value} of ${goal} questions today`}
      className="shrink-0"
    >
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--bb-hair)" strokeWidth="7" />
      {done > 0 && (
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={done >= 1 ? "var(--bb-green)" : "var(--bb-blue)"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${done * c} ${c}`}
          transform="rotate(-90 32 32)"
          className="transition-[stroke-dasharray] duration-500"
        />
      )}
      <text x="32" y="37" textAnchor="middle" className="fill-bb-ink text-[15px] font-bold tabular-nums">
        {value}
      </text>
    </svg>
  );
}

function dayName(ms: number, now: number) {
  const days = Math.round((ms - new Date(new Date(now).toDateString()).getTime()) / 86_400_000);
  if (days === 1) return "tomorrow";
  if (days < 7) return new Date(ms).toLocaleDateString(undefined, { weekday: "long" });
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function GoalForm({ goal, onSave, onCancel }: { goal: Goal | null; onSave: (g: Goal) => void; onCancel?: () => void }) {
  const id = useId();
  const [target, setTarget] = useState(String(goal?.target ?? 700));
  const [date, setDate] = useState(goal?.testDate ?? "");
  const [daily, setDaily] = useState(String(goal?.daily ?? DEFAULT_DAILY));
  const t = Math.round(Number(target) / 10) * 10;
  const d = Math.round(Number(daily));
  const ok = t >= 200 && t <= 800 && d >= 1 && d <= 200;
  const field = "mt-1 w-full rounded-lg border border-bb-line bg-bb-surface px-3 py-2 text-[15px] tabular-nums";
  return (
    <form
      className="grid gap-4 sm:grid-cols-[1fr_1.3fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (ok)
          onSave({
            target: t,
            testDate: date,
            daily: d,
            updatedAt: Date.now(),
          });
      }}
    >
      <label className="text-sm font-semibold" htmlFor={`${id}-t`}>
        Target score
        <input
          id={`${id}-t`}
          type="number"
          min={200}
          max={800}
          step={10}
          required
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className={field}
        />
      </label>
      <label className="text-sm font-semibold" htmlFor={`${id}-d`}>
        Test date <span className="font-normal text-bb-muted">(optional)</span>
        <input id={`${id}-d`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </label>
      <label className="text-sm font-semibold" htmlFor={`${id}-q`}>
        Questions a day
        <input
          id={`${id}-q`}
          type="number"
          min={1}
          max={200}
          required
          value={daily}
          onChange={(e) => setDaily(e.target.value)}
          className={field}
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="bb-btn bb-btn-primary" disabled={!ok}>
          Save
        </button>
        {onCancel && (
          <button type="button" className="bb-btn bb-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

/**
 * The home page's plan: the score goal and test-day countdown, today's question count against the
 * daily goal, skills to work on, and missed questions due for review.
 */
export function Plan({
  bank,
  byId,
  progress: serverProgress,
  latestExam,
  serverGoal,
  onStart,
}: {
  bank: Question[];
  byId: Map<string, Question>;
  progress: ProgressMap | null;
  latestExam: SessionSummary | null;
  serverGoal: Goal | null;
  onStart: (title: string, ids: string[]) => void;
}) {
  const progress = useProgress(serverProgress, byId);
  const [now, setNow] = useState<number | null>(null);
  const [goal, setGoal] = useState<Goal | null>(serverGoal);
  const [local, setLocal] = useState<Session[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- the clock and this browser's copies, after mount */
    setNow(Date.now());
    setGoal((g) => newerGoal(g, localGoal()));
    setLocal(listFinished());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // A new day while the page is open.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const queue = useMemo(() => (now ? reviewQueue(progress, now, (id) => byId.has(id)) : null), [progress, now, byId]);
  const skills = useMemo(() => suggestSkills(bank, progress), [bank, progress]);
  const exam = useMemo(() => {
    const exams = mergeSessions(latestExam ? [latestExam] : [], local, byId).filter((s) => s.kind === "exam");
    return exams[0]?.estimate ?? null;
  }, [latestExam, local, byId]);

  if (now === null || !queue) return <div className="h-[220px]" aria-hidden="true" />;

  const daily = goal?.daily ?? DEFAULT_DAILY;
  const today = answeredToday(progress, now);
  const days = goal ? daysUntil(goal.testDate, now) : null;
  const save = (g: Goal) => {
    setGoal(g);
    setEditing(false);
    void storeGoal(g);
  };

  return (
    <section aria-labelledby="plan-title" className="space-y-3">
      <div className="flex items-baseline gap-4">
        <h2 id="plan-title" className="flex-1 font-semibold">
          Your plan
        </h2>
        {goal && !editing && (
          <button
            className="flex items-center gap-1.5 text-sm text-bb-muted hover:text-bb-ink"
            onClick={() => setEditing(true)}
          >
            <Pencil size={13} aria-hidden="true" />
            Edit goal
          </button>
        )}
      </div>
      {goal && !editing && (
        <p className="-mt-1 text-sm text-bb-muted">
          {days === null ? null : days > 1 ? (
            <>
              <CalendarDays size={14} className="mr-1 inline align-[-2px]" aria-hidden="true" />
              <strong className="text-bb-ink">{days} days</strong> to test day ·{" "}
            </>
          ) : days === 1 ? (
            <>Test day is tomorrow. Get some sleep · </>
          ) : days === 0 ? (
            <>Test day is today. Good luck! · </>
          ) : (
            <>Your test date has passed · </>
          )}
          <Target size={14} className="mr-1 inline align-[-2px]" aria-hidden="true" />
          Target <strong className="text-bb-ink">{goal.target}</strong>
          {exam &&
            (exam.score >= goal.target ? (
              <> · latest exam ≈ {exam.score}, on target</>
            ) : (
              <>
                {" "}
                · latest exam ≈ {exam.score}, <span className="text-bb-ink">{goal.target - exam.score} to go</span>
              </>
            ))}
        </p>
      )}

      {(!goal || editing) && (
        <div className="rounded-xl bg-bb-subtle px-4 py-4 sm:px-5">
          {!goal && (
            <p className="mb-3 text-[15px]">
              Set a target score and your test date to get a daily goal and a countdown.
            </p>
          )}
          <GoalForm goal={goal} onSave={save} onCancel={goal ? () => setEditing(false) : undefined} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 gap-4 rounded-xl bg-bb-subtle px-4 py-4 sm:px-5">
          <Ring value={today} goal={daily} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {today >= daily ? "Daily goal done" : `${daily - today} to go today`}
              <span className="ml-1.5 font-normal text-bb-muted">
                · {today}/{daily}
              </span>
            </p>
            {skills.length > 0 && (
              <>
                <p className="mt-1 text-sm text-bb-muted">Work on</p>
                <ul className="mt-0.5 space-y-0.5 text-[15px]">
                  {skills.map((s) => (
                    <li key={s.skill} className="flex items-baseline gap-2">
                      <Link
                        href={skillLink(s.skill)}
                        className="min-w-0 truncate font-semibold text-bb-link hover:underline"
                      >
                        {s.skill}
                      </Link>
                      <span className="shrink-0 text-sm text-bb-muted">
                        {s.accuracy === null ? "not tried" : `${Math.round(s.accuracy * 100)}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col rounded-xl bg-bb-subtle px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <RotateCcw size={20} className="mt-0.5 shrink-0 text-bb-muted" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {queue.due.length
                  ? `${queue.due.length} missed ${queue.due.length === 1 ? "question" : "questions"} to review`
                  : "Review"}
              </p>
              <p className="text-sm text-bb-muted">
                {queue.due.length
                  ? "Due today. Getting them right now is what makes them stick."
                  : queue.next
                    ? `Nothing due today. Next: ${queue.next.count} ${dayName(queue.next.day, now)}.`
                    : queue.waiting
                      ? "Nothing due today."
                      : "Missed questions come back here to try again."}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-auto sm:pt-3">
            {queue.due.length > 0 && (
              <button
                className="bb-btn bb-btn-primary"
                onClick={() => onStart("Review", queue.due.slice(0, REVIEW_SET))}
              >
                Start review
                {queue.due.length > REVIEW_SET ? ` · ${REVIEW_SET}` : ""}
              </button>
            )}
            <span className="text-xs text-bb-muted">
              Missed questions return after {REVIEW_DAYS.join(", ").replace(/, (\d+)$/, " and $1")} days
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
