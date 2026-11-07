import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader, PAGE } from "../AppHeader";
import { DbNotice } from "../DbNotice";
import { StatsView, type StatsTab } from "./StatsView";
import { getBank } from "@/server/bank";
import { dbStatus } from "@/server/db";
import { getAttemptRows, listSessions, orNull } from "@/server/progress";

/** Stats and History are one glass dashboard; the route picks the view it opens on. */
export function StatsPage({ view }: { view: StatsTab }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh">
          <AppHeader active="stats" />
          <p className={`${PAGE} py-6 text-bb-muted sm:py-10`}>Loading stats…</p>
        </div>
      }
    >
      <StatsData view={view} />
    </Suspense>
  );
}

async function loadStats() {
  await connection();
  const [bank, rows, sessions] = await Promise.all([getBank(), orNull(getAttemptRows), orNull(() => listSessions())]);
  return { bank, rows, sessions, now: Date.now() };
}

async function StatsData({ view }: { view: StatsTab }) {
  const { bank, rows, sessions, now } = await loadStats();
  return (
    <StatsView
      view={view}
      bank={bank}
      rows={rows.data ?? []}
      sessions={sessions.data}
      now={now}
      notice={<DbNotice status={dbStatus()} error={rows.error || sessions.error} className="" />}
    />
  );
}
