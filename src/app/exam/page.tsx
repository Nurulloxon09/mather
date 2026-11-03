import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { ExamRunner } from "@/components/runner/ExamRunner";
import { getBank } from "@/server/bank";

export const metadata: Metadata = { title: "Exam · Mather" };

export default function Page() {
  return (
    <Suspense>
      <ExamData />
    </Suspense>
  );
}

// The bank includes published uploads, so it's read per request.
async function ExamData() {
  await connection();
  return <ExamRunner bank={await getBank()} />;
}
