import { Suspense } from "react";
import { connection } from "next/server";
import { AppHeader } from "@/components/AppHeader";
import { Home, type RecentData } from "@/components/home/Home";
import { getBank } from "@/server/bank";
import { dbMode } from "@/server/db";
import { listSessions, orNull } from "@/server/progress";

async function loadRecent(): Promise<RecentData> {
  await connection();
  const { data, error } = await orNull(() => listSessions(8));
  return { sessions: data, mode: dbMode(), error };
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
