"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Timer } from "lucide-react";
import { AppHeader, PAGE } from "../AppHeader";
import { DbNotice } from "../DbNotice";
import { SessionList } from "../SessionList";
import { Card3D } from "../ui/animated-3d-card";
import { buildModule, shuffle } from "@/lib/select";
import {
  clearActive,
  getActive,
  listFinished,
  newExamSession,
  newPracticeSession,
  saveSession,
  sessionLabel,
  sessionModules,
  type Session,
} from "@/lib/session";
import { mergeSessions, type SessionSummary } from "@/lib/history";
import type { Question } from "@/lib/types";
import type { DbStatus } from "@/server/db";

export type RecentData = { sessions: SessionSummary[] | null; db: DbStatus; error: boolean };

function answered(s: Session) {
  return sessionModules(s).reduce((n, m) => n + m.questionIds.filter((id) => m.items[id]?.answer).length, 0);
}

function ResumeLine({ text, href, onDiscard }: { text: React.ReactNode; href: string; onDiscard: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-bb-subtle px-4 py-3 text-[15px]">
      <span className="min-w-0 flex-1">
        <span className="text-bb-muted">In progress · </span>
        {text}
      </span>
      <button className="text-sm text-bb-muted hover:text-bb-red" onClick={onDiscard}>
        Discard
      </button>
      <Link href={href} className="font-semibold text-bb-link hover:underline">
        Resume
      </Link>
    </div>
  );
}

/** The exam card is Bluebook blue; practice is the quieter slate. */
const EXAM_GRADIENT = "from-[#4a64dc] via-[#324dc7] to-[#22348c]";

/** The two big actions are tilting 3D cards. The tilt needs perspective on the parent. */
const ACTION = "space-y-3 [perspective:1200px]";
const CARD_FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bb-blue";

function Switch({ on, onChange, label, hint }: { on: boolean; onChange: (on: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      title={hint}
      onClick={() => onChange(!on)}
      className="flex items-center gap-2.5 text-sm text-bb-muted hover:text-bb-ink"
    >
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-bb-blue" : "bg-bb-line"}`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${on ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
      {label}
    </button>
  );
}

function Notice({ recent }: { recent: Promise<RecentData> }) {
  const { db, error } = use(recent);
  return <DbNotice status={db} error={error} />;
}

function Recent({ recent, byId }: { recent: Promise<RecentData>; byId: Map<string, Question> }) {
  const { sessions } = use(recent);
  const [local, setLocal] = useState<Session[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage after mount
    setLocal(listFinished());
  }, []);

  const rows = useMemo(() => mergeSessions(sessions, local, byId, 5), [sessions, local, byId]);

  if (!rows.length) {
    return <p className="border-t border-bb-hair py-4 text-sm text-bb-muted">Nothing yet. Finished sets and exams show up here.</p>;
  }
  return <SessionList rows={rows} />;
}

export function Home({ bank, recent }: { bank: Question[]; recent: Promise<RecentData> }) {
  const router = useRouter();
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const [mounted, setMounted] = useState(false);
  const [activePractice, setActivePractice] = useState<Session | undefined>();
  const [activeExam, setActiveExam] = useState<Session | undefined>();
  const [adaptive, setAdaptive] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from localStorage after mount */
    setActivePractice(getActive("practice"));
    setActiveExam(getActive("exam"));
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // The practice card navigates on click rather than being a <Link>, so warm the route by hand.
  useEffect(() => {
    router.prefetch("/bank");
  }, [router]);

  const examPool = bank.filter((q) => !q.flag);

  const quickPractice = () => {
    if (activePractice && !confirm(`"${sessionLabel(activePractice)}" is still in progress. Start a new set instead?`)) {
      return;
    }
    saveSession(newPracticeSession("Quick 10", shuffle(bank).slice(0, 10).map((q) => q.id)));
    router.push("/practice");
  };

  const startExam = () => {
    if (activeExam && !confirm(`"${sessionLabel(activeExam)}" is still in progress. Start a new exam instead?`)) {
      return;
    }
    saveSession(newExamSession(adaptive, buildModule(examPool, "standard")));
    router.push("/exam");
  };

  const discard = (mode: Session["mode"]) => {
    clearActive(mode);
    if (mode === "exam") setActiveExam(undefined);
    else setActivePractice(undefined);
  };

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <Suspense>
        <Notice recent={recent} />
      </Suspense>

      <main className={`${PAGE} space-y-10 py-6 sm:py-10`}>
        {mounted && (activeExam || activePractice) && (
          <div className="space-y-2">
            {activeExam?.mode === "exam" && (
              <ResumeLine
                text={
                  <>
                    {activeExam.custom ? sessionLabel(activeExam) : `Full exam, Module ${activeExam.current + 1}`} ·{" "}
                    {Math.ceil(activeExam.modules[activeExam.current].secondsLeft / 60)} min left
                  </>
                }
                href="/exam"
                onDiscard={() => discard("exam")}
              />
            )}
            {activePractice?.mode === "practice" && (
              <ResumeLine
                text={
                  <>
                    {activePractice.title} · {answered(activePractice)}/{activePractice.module.questionIds.length} answered
                  </>
                }
                href="/practice"
                onDiscard={() => discard("practice")}
              />
            )}
          </div>
        )}

        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
          <div className={ACTION}>
            <Card3D
              title="Start full exam"
              description="44 questions · 70 minutes. Two 35-minute modules with the calculator and reference sheet, like test day."
              icon={<Timer size={28} strokeWidth={1.75} />}
              gradient={EXAM_GRADIENT}
              size="sm"
              variant="premium"
              cta="Begin"
              disabled={examPool.length < 44}
              onClick={startExam}
              className={CARD_FOCUS}
            />
            {examPool.length < 44 ? (
              <p className="text-sm text-bb-red">Needs at least 44 questions in the bank.</p>
            ) : (
              <Switch
                on={adaptive}
                onChange={setAdaptive}
                label="Adaptive Module 2"
                hint="Module 2 is harder or easier depending on how Module 1 went"
              />
            )}
          </div>
          <div className={ACTION}>
            <Card3D
              title="Practice"
              description={`${bank.length} questions in 4 sections: Algebra, Advanced Math, Geometry and Problem Solving.`}
              icon={<BookOpen size={28} strokeWidth={1.75} />}
              theme="primary"
              size="sm"
              variant="premium"
              cta="Choose a section"
              onClick={() => router.push("/bank")}
              className={CARD_FOCUS}
            />
            <div className="flex gap-5 text-sm">
              <button className="text-bb-muted hover:text-bb-ink" onClick={quickPractice}>
                Quick 10
              </button>
              <Link href="/bank?status=incorrect" className="text-bb-muted hover:text-bb-ink">
                Redo missed
              </Link>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-2 flex items-baseline">
            <h2 className="flex-1 font-semibold">Recent</h2>
            <Link href="/history" className="text-sm text-bb-muted hover:text-bb-ink">
              See all
            </Link>
          </div>
          <Suspense fallback={<p className="border-t border-bb-hair py-4 text-sm text-bb-muted">Loading…</p>}>
            <Recent recent={recent} byId={byId} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
