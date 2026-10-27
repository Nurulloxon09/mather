import { Suspense } from "react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { Results } from "@/components/results/Results";
import { getBank } from "@/server/bank";
import { getStoredSession, orNull } from "@/server/progress";

export const metadata: Metadata = { title: "Results · Mather" };

export default function Page({ searchParams }: PageProps<"/results">) {
  return (
    <Suspense fallback={<Loading />}>
      <ResultsData searchParams={searchParams} />
    </Suspense>
  );
}

async function ResultsData({ searchParams }: Pick<PageProps<"/results">, "searchParams">) {
  const { id } = await searchParams;
  const sid = typeof id === "string" ? id : null;
  const [bank, stored] = await Promise.all([
    getBank(),
    sid ? orNull(() => getStoredSession(sid)) : Promise.resolve({ data: null }),
  ]);
  return <Results bank={bank} id={sid} stored={stored.data} />;
}

function Loading() {
  return (
    <div className="min-h-dvh bg-[#f6f7fb]">
      <AppHeader />
      <p className="mx-auto max-w-6xl px-6 py-10 text-bb-muted">Loading results…</p>
    </div>
  );
}
