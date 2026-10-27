import type { Metadata } from "next";
import { PracticeRunner } from "@/components/runner/PracticeRunner";
import { QUESTIONS } from "@/data/questions";

export const metadata: Metadata = { title: "Practice · Mather" };

export default function Page() {
  return <PracticeRunner bank={QUESTIONS} />;
}
