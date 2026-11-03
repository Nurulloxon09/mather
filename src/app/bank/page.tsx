import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { AppHeader, PAGE } from "@/components/AppHeader";
import { Bank } from "@/components/bank/Bank";
import { DbNotice } from "@/components/DbNotice";
import { getBank } from "@/server/bank";
import { dbMode } from "@/server/db";
import { getProgress, orNull } from "@/server/progress";

export const metadata: Metadata = { title: "Practice · Mather" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <BankData />
    </Suspense>
  );
}

async function BankData() {
  await connection();
  const [bank, progress] = await Promise.all([getBank(), orNull(getProgress)]);
  return (
    <Bank bank={bank} progress={progress.data} notice={<DbNotice mode={dbMode()} error={progress.error} />} />
  );
}

function Loading() {
  return (
    <div className="min-h-dvh">
      <AppHeader active="bank" />
      <p className={`${PAGE} py-10 text-bb-muted`}>Loading questions…</p>
    </div>
  );
}
