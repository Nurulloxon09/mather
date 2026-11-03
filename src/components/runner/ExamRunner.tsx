"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckYourWork } from "../bluebook/CheckYourWork";
import { QuestionView } from "../bluebook/QuestionView";
import { attemptFor } from "@/lib/attempts";
import { addTime, currentId, goTo, gridCells, setAnswer, toggleCross, toggleMark } from "@/lib/module";
import { flush, flushWithin, queue } from "@/lib/outbox";
import { buildModule, routeFor } from "@/lib/select";
import {
  getActive,
  getSettings,
  MODULE_SECONDS,
  moduleScore,
  newModule,
  saveSession,
  saveSettings,
  timedSeconds,
  type ExamSession,
  type ModuleState,
} from "@/lib/session";
import type { Question } from "@/lib/types";
import { CenterMessage, Modal, TestShell } from "./TestShell";

const WARNING_AT = 5 * 60;

export function ExamRunner({ bank }: { bank: Question[] }) {
  const router = useRouter();
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  // Questions with known source problems never go into an exam.
  const pool = useMemo(() => bank.filter((q) => !q.flag), [bank]);
  const [session, setSession] = useState<ExamSession | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [loadingNext, setLoadingNext] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [strike, setStrike] = useState(false);
  // A test that hasn't started yet opens on a start screen; the clock waits for "Begin".
  const [begun, setBegun] = useState(false);
  const latest = useRef<ExamSession | null>(null);

  useEffect(() => {
    const s = getActive("exam");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from localStorage after mount
    setSession(s?.mode === "exam" ? s : null);
    setName(getSettings().name);
  }, []);

  useEffect(() => {
    latest.current = session ?? null;
    if (session) saveSession(session);
  }, [session]);

  const updateModule = useCallback((fn: (m: ModuleState) => ModuleState) => {
    setSession((s) => {
      if (!s) return s;
      const modules = [...s.modules];
      modules[s.current] = fn(modules[s.current]);
      return { ...s, modules };
    });
  }, []);

  const submitModule = useCallback(() => {
    const s = latest.current;
    if (!s || s.finishedAt) return;
    setConfirmSubmit(false);
    const now = Date.now();
    const done = { ...s.modules[s.current], submittedAt: now, onReview: false };
    if (s.current === 0 && !s.custom) {
      const { correct, total } = moduleScore(done, byId);
      const route = s.adaptive ? routeFor(correct, total) : undefined;
      const ids = buildModule(pool, route ?? "standard", new Set(done.questionIds));
      setSession({ ...s, modules: [done, newModule(ids)], current: 1, route });
      // Module 1 counts even if the test is abandoned later.
      queue({ attempts: done.questionIds.map((id) => attemptFor(s, done, id, now)) });
      void flush();
      setLoadingNext(true);
      setTimeout(() => setLoadingNext(false), 1800);
    } else {
      const modules = [...s.modules];
      modules[s.current] = done;
      const finished: ExamSession = { ...s, modules, finishedAt: now };
      saveSession(finished);
      queue({ sessions: [finished] });
      latest.current = finished;
      setSession(finished);
      // Give the save a moment so the results page can load it from the database.
      void flushWithin(4000).then(() => router.push(`/results?id=${finished.id}`));
    }
  }, [pool, byId, router]);

  const intro = !!session && !session.finishedAt && !begun && notStarted(session);

  // One-second clock: counts the module down and charges time to the visible question.
  const running = !!session && !session.finishedAt && !loadingNext && !intro;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      updateModule((m) => addTime({ ...m, secondsLeft: m.secondsLeft - 1 }, 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [running, updateModule]);

  const secondsLeft = session ? session.modules[session.current].secondsLeft : 0;

  useEffect(() => {
    if (running && secondsLeft <= 0) submitModule();
  }, [secondsLeft, running, submitModule]);

  // Shown for a few seconds when the clock reaches 5:00 (unless the module started with less).
  const moduleSeconds = session?.custom
    ? timedSeconds(session.modules[session.current].questionIds.length)
    : MODULE_SECONDS;
  const warning =
    moduleSeconds > WARNING_AT && secondsLeft <= WARNING_AT && secondsLeft > WARNING_AT - 8
      ? "5 minutes remaining in this module"
      : null;

  if (session === undefined) return null;
  if (session === null)
    return (
      <CenterMessage title="No test in progress">
        Start an exam from the home page, or a timed set from the question bank.
      </CenterMessage>
    );
  if (session.finishedAt) return <p className="p-10 text-center font-semibold">Opening results…</p>;

  if (intro) {
    return (
      <StartScreen
        session={session}
        name={name}
        onName={(v) => {
          setName(v);
          saveSettings({ ...getSettings(), name: v });
        }}
        onBegin={() => setBegun(true)}
        onBack={() => router.push(session.custom ? "/bank" : "/")}
      />
    );
  }

  const moduleNo = session.current + 1;
  if (loadingNext) {
    return (
      <div className="bb-light grid min-h-dvh place-items-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-bb-blue-soft border-t-bb-blue" />
          <p className="mt-5 text-lg font-bold">Loading Module {moduleNo}…</p>
        </div>
      </div>
    );
  }

  const m = session.modules[session.current];
  const qid = currentId(m);
  const q = byId.get(qid);
  const item = m.items[qid] ?? { timeMs: 0 };
  const last = m.index === m.questionIds.length - 1;
  const title = session.custom ? `Timed Set: ${session.custom}` : `Section 2, Module ${moduleNo}: Math`;
  const endsTest = !!session.custom || moduleNo === 2;

  return (
    <TestShell
      title={title}
      navTitle={`${title} Questions`}
      name={name}
      seconds={secondsLeft}
      timerHidden={session.timerHidden}
      timerLocked={secondsLeft <= WARNING_AT}
      onToggleTimer={() => setSession({ ...session, timerHidden: !session.timerHidden })}
      warning={warning}
      moreItems={[
        { label: "Go to Review Page", onClick: () => updateModule((x) => ({ ...x, onReview: true })) },
        { label: "Save and Exit", onClick: () => router.push("/") },
      ]}
      index={m.index}
      total={m.questionIds.length}
      cells={gridCells(m)}
      onJump={(i) => updateModule((x) => goTo(x, i))}
      onReviewPage={() => updateModule((x) => ({ ...x, onReview: true }))}
      showNav={!m.onReview}
      buttons={
        m.onReview ? (
          <>
            <button className="bb-btn bb-btn-primary" onClick={() => updateModule((x) => goTo(x, x.questionIds.length - 1))}>
              Back
            </button>
            <button className="bb-btn bb-btn-primary" onClick={() => setConfirmSubmit(true)}>
              Next
            </button>
          </>
        ) : (
          <>
            {m.index > 0 && (
              <button className="bb-btn bb-btn-primary" onClick={() => updateModule((x) => goTo(x, x.index - 1))}>
                Back
              </button>
            )}
            <button
              className="bb-btn bb-btn-primary"
              onClick={() =>
                updateModule((x) => (last ? { ...x, onReview: true } : goTo(x, x.index + 1)))
              }
            >
              Next
            </button>
          </>
        )
      }
    >
      {m.onReview ? (
        <CheckYourWork
          title={`${title} Questions`}
          cells={gridCells(m)}
          onPick={(i) => updateModule((x) => goTo(x, i))}
        />
      ) : q ? (
        <QuestionView
          key={qid}
          q={q}
          number={m.index + 1}
          item={item}
          strikeMode={strike}
          onToggleStrike={() => setStrike((v) => !v)}
          onAnswer={(a) => updateModule((x) => setAnswer(x, a))}
          onToggleMark={() => updateModule(toggleMark)}
          onCross={(l) => updateModule((x) => toggleCross(x, l))}
        />
      ) : (
        <CenterMessage title="Question not found">This question was removed from the bank.</CenterMessage>
      )}

      {confirmSubmit && (
        <Modal onClose={() => setConfirmSubmit(false)} width={460}>
          <div className="p-6">
            <h2 className="text-xl font-bold">{session.custom ? "Submit this set?" : `Submit Module ${moduleNo}?`}</h2>
            <p className="mt-2 text-[15px] text-bb-muted">
              {endsTest
                ? "This ends the test and shows your results."
                : "You won't be able to return to these questions. Module 2 starts right away."}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="bb-btn bb-btn-outline" onClick={() => setConfirmSubmit(false)}>
                Cancel
              </button>
              <button className="bb-btn bb-btn-primary" onClick={submitModule}>
                Submit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </TestShell>
  );
}

/** True until the first second of Module 1 has been spent. */
function notStarted(s: ExamSession) {
  return s.current === 0 && Object.values(s.modules[0].items).every((it) => !it?.timeMs && !it?.answer && !it?.marked);
}

function StartScreen({
  session,
  name,
  onName,
  onBegin,
  onBack,
}: {
  session: ExamSession;
  name: string;
  onName: (name: string) => void;
  onBegin: () => void;
  onBack: () => void;
}) {
  const m = session.modules[0];
  return (
    <div className="bb-light grid min-h-dvh place-items-center px-5 py-10">
      <form
        className="w-full max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          onBegin();
        }}
      >
        <p className="text-sm font-semibold text-bb-muted">{session.custom ? "Timed set" : "Full exam"}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{session.custom ?? "SAT Math"}</h1>
        <ul className="mt-6 space-y-1.5 text-[15px]">
          {session.custom ? (
            <li>
              {m.questionIds.length} questions · {Math.round(m.secondsLeft / 60)} minutes
            </li>
          ) : (
            <>
              <li>2 modules · 22 questions each · 35 minutes each</li>
              {session.adaptive && <li>Module 2 is harder or easier depending on Module 1</li>}
            </>
          )}
          <li>No feedback until the end</li>
          <li>Submits itself when time runs out</li>
        </ul>
        <label className="mt-8 block">
          <span className="text-sm font-semibold">Your name</span>
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Shown at the bottom of the test"
            autoComplete="name"
            className="mt-1.5 w-full rounded-lg border border-bb-line px-3 py-2.5 outline-none focus:border-bb-blue"
          />
        </label>
        <div className="mt-8 flex items-center gap-6">
          <button type="submit" className="bb-btn bb-btn-primary">
            Begin
          </button>
          <button type="button" className="text-sm text-bb-muted hover:text-bb-ink" onClick={onBack}>
            Not now
          </button>
        </div>
      </form>
    </div>
  );
}
