import { Suspense } from "react";
import type { Metadata } from "next";
import { Results } from "@/components/results/Results";
import { QUESTIONS } from "@/data/questions";

export const metadata: Metadata = { title: "Results · Mather" };

export default function Page() {
  return (
    <Suspense>
      <Results bank={QUESTIONS} />
    </Suspense>
  );
}
