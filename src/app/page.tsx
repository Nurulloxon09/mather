import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader } from "@/components/AppHeader";
import { Home, type RecentData } from "@/components/home/Home";
import { getBank } from "@/server/bank";
import { dbStatus } from "@/server/db";
import { getGoal } from "@/server/help";
import { getProgress, listExams, listSessions, orNull } from "@/server/progress";

async function loadRecent(): Promise<RecentData> {
  await connection();
  const [recent, progress, exams, goal] = await Promise.all([
    orNull(() => listSessions(8)),
    orNull(getProgress),
    orNull(() => listExams(1)),
    orNull(getGoal),
  ]);
  return {
    sessions: recent.data,
    progress: progress.data,
    latestExam: exams.data?.[0] ?? null,
    goal: goal.data,
    db: dbStatus(),
    error: recent.error || progress.error,
  };
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh">
          <AppHeader />
        </div>
      }
    >
      <HomeData />
    </Suspense>
  );
}

async function HomeData() {
  await connection();
  // Recent results aren't awaited: the page renders right away and they stream in.
  return <Home bank={await getBank()} recent={loadRecent()} />;
}
