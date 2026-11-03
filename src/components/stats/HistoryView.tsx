"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatClock } from "../bluebook/TopBar";
import { LocalDate } from "../LocalDate";
import { mergeSessions, type SessionSummary } from "@/lib/history";
import { listFinished, type Session } from "@/lib/session";
import type { Question } from "@/lib/types";

type Kind = SessionSummary["kind"] | "all";
const KINDS: [Kind, string][] = [
  ["all", "All"],
  ["exam", "Full exams"],
  ["timed", "Timed sets"],
  ["practice", "Practice"],
];

export function HistoryView({ sessions, bank }: { sessions: SessionSummary[] | null; bank: Question[] }) {
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const [local, setLocal] = useState<Session[]>([]);
  const [kind, setKind] = useState<Kind>("all");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage after mount
    setLocal(listFinished());
  }, []);
  const all = useMemo(() => mergeSessions(sessions, local, byId), [sessions, local, byId]);
  const shown = all.filter((s) => kind === "all" || s.kind === kind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Show">
        {KINDS.map(([k, label]) => {
          const n = k === "all" ? all.length : all.filter((s) => s.kind === k).length;
          return (
            <button
              key={k}
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                kind === k ? "border-bb-ink bg-bb-ink text-white" : "border-bb-line bg-white hover:border-bb-ink"
              }`}
            >
              {label} <span className={kind === k ? "text-white/75" : "text-bb-muted"}>{n}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bb-line px-6 py-12 text-center text-bb-muted">
          Nothing here yet. Finished sets and exams show up here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-bb-line bg-white">
          <table className="w-full min-w-[640px] text-[15px]">
            <thead className="bg-bb-bar text-left text-xs uppercase tracking-wide text-bb-muted">
              <tr>
                <th className="px-5 py-2.5">Finished</th>
                <th className="py-2.5 pr-3">Set</th>
                <th className="py-2.5 pr-3 text-right">Score</th>
                <th className="py-2.5 pr-3 text-right">Estimate</th>
                <th className="py-2.5 pr-5 text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id} className="border-t border-bb-bar hover:bg-[#f7f8fc]">
                  <td className="whitespace-nowrap px-5 py-3 text-sm text-bb-muted">
                    <LocalDate ms={s.finishedAt} />
                  </td>
                  <td className="py-3 pr-3">
                    <Link href={`/results?id=${s.id}`} className="font-semibold hover:text-bb-blue hover:underline">
                      {s.title}
                    </Link>
                    {s.route && <span className="ml-2 text-xs text-bb-muted">{s.route} Module 2</span>}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-3 text-right tabular-nums">
                    <span className="font-bold">
                      {s.correct}/{s.total}
                    </span>
                    <span className="ml-1.5 text-sm text-bb-muted">{s.total ? Math.round((s.correct / s.total) * 100) : 0}%</span>
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums">{s.estimate ? `≈ ${s.estimate.score}` : <span className="text-bb-muted">–</span>}</td>
                  <td className="py-3 pr-5 text-right tabular-nums text-bb-muted">{formatClock(s.timeMs / 1000)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
