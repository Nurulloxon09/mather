"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "../AppHeader";
import { DbNotice } from "../DbNotice";
import { LocalDate } from "../LocalDate";
import { buildModule, shuffle } from "@/lib/select";
import {
  clearActive,
  getActive,
  getSettings,
  listFinished,
  newExamSession,
  newPracticeSession,
  saveSession,
  saveSettings,
  sessionLabel,
  sessionModules,
  sessionScore,
  type Session,
} from "@/lib/session";
import type { Question } from "@/lib/types";
import type { DbMode } from "@/server/db";
import type { SessionSummary } from "@/server/progress";

export type RecentData = { sessions: SessionSummary[] | null; mode: DbMode; error: boolean };

function answered(s: Session) {
  return sessionModules(s).reduce((n, m) => n + m.questionIds.filter((id) => m.items[id]?.answer).length, 0);
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-bb-line bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ResumeBanner({ text, href, onDiscard }: { text: React.ReactNode; href: string; onDiscard: () => void }) {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-lg bg-bb-blue-soft px-4 py-3 text-sm">
      <span className="flex-1">
        <strong>In progress:</strong> {text}
      </span>
      <button className="font-semibold text-bb-red hover:underline" onClick={onDiscard}>
        Discard
      </button>
      <Link href={href} className="bb-btn bb-btn-primary !px-4 !py-1.5 text-sm">
        Resume
      </Link>
    </div>
  );
}

function Notice({ recent }: { recent: Promise<RecentData> }) {
  const { mode, error } = use(recent);
  return <DbNotice mode={mode} error={error} />;
}

function Recent({ recent, byId }: { recent: Promise<RecentData>; byId: Map<string, Question> }) {
  const { sessions } = use(recent);
  const [local, setLocal] = useState<Session[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage after mount
    setLocal(listFinished());
  }, []);

  const rows = useMemo(() => {
    const out: SessionSummary[] = [...(sessions ?? [])];
    const known = new Set(out.map((s) => s.id));
    // The server list is a top 8; anything older than its last row is off the list on purpose.
    const cutoff = sessions && sessions.length >= 8 ? sessions[sessions.length - 1].finishedAt : 0;
    for (const s of local) {
      // Sessions the server list doesn't have yet (just uploaded, still queued, or no database).
      if (known.has(s.id) || s.finishedAt! < cutoff) continue;
      const { correct, total } = sessionScore(s, byId);
      out.push({ id: s.id, mode: s.mode, title: sessionLabel(s), finishedAt: s.finishedAt!, correct, total });
    }
    return out.sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 8);
  }, [sessions, local, byId]);

  if (!rows.length) {
    return <p className="text-sm text-bb-muted">Nothing yet. Finish a set or an exam to see it here.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((s) => (
        <Link
          key={s.id}
          href={`/results?id=${s.id}`}
          className="flex items-center gap-4 rounded-xl border border-bb-line bg-white px-5 py-4 hover:border-bb-blue"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{s.title}</div>
            <div className="text-sm text-bb-muted">
              <LocalDate ms={s.finishedAt} />
            </div>
          </div>
          <div className="text-xl font-bold">
            {s.correct}/{s.total}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function Home({ bank, recent }: { bank: Question[]; recent: Promise<RecentData> }) {
  const router = useRouter();
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [activePractice, setActivePractice] = useState<Session | undefined>();
  const [activeExam, setActiveExam] = useState<Session | undefined>();
  const [adaptive, setAdaptive] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from localStorage after mount */
    setName(getSettings().name);
    setActivePractice(getActive("practice"));
    setActiveExam(getActive("exam"));
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

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
    <div className="min-h-dvh bg-[#f6f7fb]">
      <AppHeader active="home">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-bb-muted">Name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              saveSettings({ ...getSettings(), name: e.target.value });
            }}
            placeholder="Shown in the test"
            className="w-44 rounded-md border border-bb-line px-2.5 py-1.5 outline-none focus:border-bb-blue"
          />
        </label>
      </AppHeader>
      <Suspense>
        <Notice recent={recent} />
      </Suspense>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-2">
        <Card title="Practice">
          {mounted && activePractice?.mode === "practice" && (
            <ResumeBanner
              text={
                <>
                  {activePractice.title} · {answered(activePractice)}/{activePractice.module.questionIds.length} answered
                </>
              }
              href="/practice"
              onDiscard={() => discard("practice")}
            />
          )}
          <p className="mb-5 text-[15px]">
            Pick questions by domain, skill, difficulty or how you did on them, then practice with instant
            feedback or as a timed set. {bank.length} questions in the bank.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/bank" className="bb-btn bb-btn-primary">
              Open Question Bank
            </Link>
            <button className="bb-btn bb-btn-outline" onClick={quickPractice}>
              Quick 10
            </button>
            <Link href="/bank?status=incorrect" className="text-sm font-semibold text-bb-blue hover:underline">
              Redo questions I missed
            </Link>
          </div>
        </Card>

        <Card title="Full exam">
          {mounted && activeExam?.mode === "exam" && (
            <ResumeBanner
              text={
                <>
                  {activeExam.custom ? sessionLabel(activeExam) : `Module ${activeExam.current + 1}`} ·{" "}
                  {Math.ceil(activeExam.modules[activeExam.current].secondsLeft / 60)} min left
                </>
              }
              href="/exam"
              onDiscard={() => discard("exam")}
            />
          )}
          <ul className="mb-5 space-y-1.5 text-[15px]">
            <li>2 modules · 22 questions each · 35 minutes each</li>
            <li>No feedback until the end · Check Your Work page after each module</li>
            <li>Auto-submits when time runs out</li>
          </ul>
          <label className="mb-6 flex items-start gap-3 text-[15px]">
            <input
              type="checkbox"
              checked={adaptive}
              onChange={(e) => setAdaptive(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--bb-blue)]"
            />
            <span>
              <strong>Adaptive Module 2</strong>
              <br />
              <span className="text-sm text-bb-muted">
                Harder or easier second module depending on how Module 1 went.
              </span>
            </span>
          </label>
          <button className="bb-btn bb-btn-primary" disabled={examPool.length < 44} onClick={startExam}>
            Start exam
          </button>
          {examPool.length < 44 && (
            <p className="mt-2 text-sm text-bb-red">Need at least 44 questions in the bank.</p>
          )}
        </Card>

        <section className="md:col-span-2">
          <h2 className="mb-3 text-lg font-bold">Recent results</h2>
          <Suspense fallback={<p className="text-sm text-bb-muted">Loading…</p>}>
            <Recent recent={recent} byId={byId} />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
