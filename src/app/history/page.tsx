import type { Metadata } from "next";
import { StatsPage } from "@/components/stats/StatsPage";

export const metadata: Metadata = { title: "History · Mather" };

/** History is a view of the Stats dashboard. */
export default function Page() {
  return <StatsPage view="history" />;
}
