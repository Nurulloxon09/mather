import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AppHeader, PAGE } from "@/components/AppHeader";
import { DbNotice } from "@/components/DbNotice";
import { HistoryView } from "@/components/stats/HistoryView";
import { StatsTabs } from "@/components/stats/StatsTabs";
import { getBank } from "@/server/bank";
import { dbMode } from "@/server/db";
import { listSessions, orNull } from "@/server/progress";

export const metadata: Metadata = { title: "History · Mather" };

export default function Page() {
  return (
    <div className="min-h-dvh">
      <AppHeader active="stats" />
      <Suspense
        fallback={
          <main className={`${PAGE} py-6 sm:py-10`}>
            <StatsTabs active="history" />
            <p className="text-bb-muted">Loading history…</p>
          </main>
        }
      >
        <HistoryData />
      </Suspense>
    </div>
  );
}

async function HistoryData() {
  await connection();
  const [bank, sessions] = await Promise.all([getBank(), orNull(() => listSessions())]);
  return (
    <>
      <DbNotice mode={dbMode()} error={sessions.error} />
      <main className={`${PAGE} py-6 sm:py-10`}>
        <StatsTabs active="history" />
        <HistoryView sessions={sessions.data} bank={bank} />
      </main>
    </>
  );
}
