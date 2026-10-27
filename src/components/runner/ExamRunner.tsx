"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckYourWork } from "../bluebook/CheckYourWork";
import { QuestionView } from "../bluebook/QuestionView";
import { addTime, currentId, goTo, gridCells, setAnswer, toggleCross, toggleMark } from "@/lib/module";
import { buildModule, routeFor } from "@/lib/select";
import {
  getActive,
  getSettings,
  moduleScore,
  newModule,
  saveSession,
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
    if (s.current === 0) {
      const { correct, total } = moduleScore(done, byId);
      const route = s.adaptive ? routeFor(correct, total) : undefined;
      const ids = buildModule(pool, route ?? "standard", new Set(done.questionIds));
      setSession({ ...s, modules: [done, newModule(ids)], current: 1, route });
      setLoadingNext(true);
      setTimeout(() => setLoadingNext(false), 1800);
    } else {
      const finished: ExamSession = { ...s, modules: [s.modules[0], done], finishedAt: now };
      saveSession(finished);
      latest.current = finished;
      setSession(finished);
      router.push(`/results?id=${finished.id}`);
    }
  }, [pool, byId, router]);

  // One-second clock: counts the module down and charges time to the visible question.
  const running = !!session && !session.finishedAt && !loadingNext;
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

  // Shown for a few seconds when the clock reaches 5:00.
  const warning =
    secondsLeft <= WARNING_AT && secondsLeft > WARNING_AT - 8 ? "5 minutes remaining in this module" : null;

  if (session === undefined) return null;
  if (session === null)
    return <CenterMessage title="No exam in progress">Start a new exam from the home page.</CenterMessage>;
  if (session.finishedAt) return <p className="p-10 text-center font-semibold">Opening results…</p>;

  const moduleNo = session.current + 1;
  if (loadingNext) {
    return (
      <div className="grid min-h-dvh place-items-center">
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
  const title = `Section 2, Module ${moduleNo}: Math`;

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
            <h2 className="text-xl font-bold">Submit Module {moduleNo}?</h2>
            <p className="mt-2 text-[15px] text-bb-muted">
              {moduleNo === 1
                ? "You won't be able to return to these questions. Module 2 starts right away."
                : "This ends the test and shows your results."}
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
