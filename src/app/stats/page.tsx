import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AppHeader } from "@/components/AppHeader";
import { DbNotice } from "@/components/DbNotice";
import { StatsView } from "@/components/stats/StatsView";
import type { QMeta } from "@/lib/stats";
import { getBank } from "@/server/bank";
import { dbMode } from "@/server/db";
import { getAttemptRows, listSessions, orNull } from "@/server/progress";

export const metadata: Metadata = { title: "Stats · Mather" };

export default function Page() {
  return (
    <div className="min-h-dvh bg-[#f6f7fb]">
      <AppHeader active="stats" />
      <Suspense fallback={<p className="mx-auto max-w-6xl px-6 py-10 text-bb-muted">Loading stats…</p>}>
        <StatsData />
      </Suspense>
    </div>
  );
}

async function loadStats() {
  await connection();
  const [bank, rows, sessions] = await Promise.all([getBank(), orNull(getAttemptRows), orNull(() => listSessions())]);
  // Only what the stats need about each question, not the full text.
  const meta: Record<string, QMeta> = Object.fromEntries(
    bank.map((q) => [q.id, { domain: q.domain, skill: q.skill, difficulty: q.difficulty, number: q.sourceNumber, source: q.source }]),
  );
  return { bankSize: bank.length, rows, sessions, meta, now: Date.now() };
}

async function StatsData() {
  const { bankSize, rows, sessions, meta, now } = await loadStats();
  return (
    <>
      <DbNotice mode={dbMode()} error={rows.error || sessions.error} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <StatsView rows={rows.data ?? []} meta={meta} sessions={sessions.data ?? []} bankSize={bankSize} now={now} />
      </main>
    </>
  );
}
