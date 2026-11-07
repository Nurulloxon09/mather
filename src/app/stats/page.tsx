import type { Metadata } from "next";
import { StatsPage } from "@/components/stats/StatsPage";

export const metadata: Metadata = { title: "Stats · Mather" };

export default function Page() {
  return <StatsPage view="overview" />;
}
