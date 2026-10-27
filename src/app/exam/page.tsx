import type { Metadata } from "next";
import { ExamRunner } from "@/components/runner/ExamRunner";
import { QUESTIONS } from "@/data/questions";

export const metadata: Metadata = { title: "Exam · Mather" };

export default function Page() {
  return <ExamRunner bank={QUESTIONS} />;
}
