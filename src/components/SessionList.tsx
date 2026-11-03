"use client";

import Link from "next/link";
import { formatClock } from "./bluebook/TopBar";
import { LocalDate } from "./LocalDate";
import type { SessionSummary } from "@/lib/history";

/** Finished sets and exams as a plain list: title and date on the left, score on the right. */
export function SessionList({ rows, showTime }: { rows: SessionSummary[]; showTime?: boolean }) {
  return (
    <ul className="divide-y divide-bb-hair border-y border-bb-hair">
      {rows.map((s) => (
        <li key={s.id}>
          <Link href={`/results?id=${s.id}`} className="group flex items-center gap-4 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold group-hover:underline">
                {s.title}
                {s.estimate && <span className="ml-2 font-normal text-bb-muted">≈ {s.estimate.score}</span>}
              </p>
              <p className="text-sm text-bb-muted">
                <LocalDate ms={s.finishedAt} />
                {showTime && s.timeMs > 0 && ` · ${formatClock(s.timeMs / 1000)}`}
                {showTime && s.route && ` · ${s.route} Module 2`}
              </p>
            </div>
            <span className="text-lg font-semibold tabular-nums">
              {s.correct}/{s.total}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
