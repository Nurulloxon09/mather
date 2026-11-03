import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AppHeader } from "@/components/AppHeader";
import { DbNotice } from "@/components/DbNotice";
import { HistoryView } from "@/components/stats/HistoryView";
import { getBank } from "@/server/bank";
import { dbMode } from "@/server/db";
import { listSessions, orNull } from "@/server/progress";

export const metadata: Metadata = { title: "History · Mather" };

export default function Page() {
  return (
    <div className="min-h-dvh bg-[#f6f7fb]">
      <AppHeader active="history" />
      <Suspense fallback={<p className="mx-auto max-w-6xl px-6 py-10 text-bb-muted">Loading history…</p>}>
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-4 text-2xl font-extrabold">History</h1>
        <HistoryView sessions={sessions.data} bank={bank} />
      </main>
    </>
  );
}
