"use client";

import { useEffect, useMemo, useState } from "react";
import { Segmented } from "../Segmented";
import { SessionList } from "../SessionList";
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

  const options = KINDS.map(([k, label]) => {
    const n = k === "all" ? all.length : all.filter((s) => s.kind === k).length;
    return [
      k,
      <>
        {label} <span className="font-normal opacity-60">{n}</span>
      </>,
    ] as const;
  });

  return (
    <div className="space-y-5">
      <Segmented value={kind} options={options} onChange={setKind} label="Show" />
      {shown.length === 0 ? (
        <p className="border-t border-bb-hair py-6 text-bb-muted">Nothing here yet. Finished sets and exams show up here.</p>
      ) : (
        <SessionList rows={shown} showTime />
      )}
    </div>
  );
}
