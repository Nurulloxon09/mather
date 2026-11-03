import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { PracticeRunner } from "@/components/runner/PracticeRunner";
import { getBank } from "@/server/bank";

export const metadata: Metadata = { title: "Practice · Mather" };

export default function Page() {
  return (
    <Suspense>
      <PracticeData />
    </Suspense>
  );
}

// The bank includes published uploads, so it's read per request.
async function PracticeData() {
  await connection();
  return <PracticeRunner bank={await getBank()} />;
}
