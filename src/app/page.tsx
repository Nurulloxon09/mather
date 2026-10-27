import { connection } from "next/server";
import { Home, type RecentData } from "@/components/home/Home";
import { getBank } from "@/server/bank";
import { dbMode } from "@/server/db";
import { listRecentSessions, orNull } from "@/server/progress";

async function loadRecent(): Promise<RecentData> {
  await connection();
  const { data, error } = await orNull(() => listRecentSessions(8));
  return { sessions: data, mode: dbMode(), error };
}

export default async function Page() {
  // Not awaited: the page shell renders right away and recent results stream in.
  return <Home bank={await getBank()} recent={loadRecent()} />;
}
