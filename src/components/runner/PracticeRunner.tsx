"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "../bluebook/icons";
import { QuestionView } from "../bluebook/QuestionView";
import { formatClock } from "../bluebook/TopBar";
import { Rich } from "../Rich";
import { addTime, currentId, goTo, gridCells, patchItem, setAnswer, toggleCross, toggleMark } from "@/lib/module";
import {
  correctAnswerTex,
  getActive,
  getSettings,
  isCorrect,
  saveSession,
  type ModuleState,
  type PracticeSession,
} from "@/lib/session";
import { tex } from "@/lib/rich";
import { entryToTex } from "@/lib/grid";
import type { Question } from "@/lib/types";
import { CenterMessage, Modal, TestShell } from "./TestShell";

function ResultModal({
  q,
  answer,
  timeMs,
  onClose,
  onNext,
  nextLabel,
}: {
  q: Question;
  answer: string | undefined;
  timeMs: number;
  onClose: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  const ok = isCorrect(q, answer);
  return (
    <Modal onClose={onClose} width={680}>
      <div className={`flex items-center gap-3 px-6 py-4 ${ok ? "bg-[#e7f5ef]" : "bg-[#fbeaec]"}`}>
        {ok ? (
          <CheckCircle width={34} height={34} className="text-bb-green" />
        ) : (
          <XCircle width={34} height={34} className="text-bb-red" />
        )}
        <h2 className={`text-2xl font-bold ${ok ? "text-bb-green" : "text-bb-red"}`}>
          {ok ? "Correct" : "Incorrect"}
        </h2>
        <span className="ml-auto text-sm font-semibold text-bb-muted">Time: {formatClock(timeMs / 1000)}</span>
      </div>
      <div className="space-y-5 px-6 py-5">
        <div className="flex flex-wrap gap-x-10 gap-y-2 text-[15px]">
          <div>
            <span className="font-semibold">Your answer: </span>
            {answer ? (
              <span dangerouslySetInnerHTML={{ __html: tex(q.type === "mcq" ? answer : entryToTex(answer)) }} />
            ) : (
              <span className="text-bb-muted">—</span>
            )}
          </div>
          <div>
            <span className="font-semibold">Correct answer: </span>
            <span dangerouslySetInnerHTML={{ __html: tex(correctAnswerTex(q)) }} />
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-[15px] font-bold">Explanation</h3>
          {q.explanation ? (
            <Rich src={q.explanation} className="!text-[16px]" />
          ) : (
            <p className="text-sm text-bb-muted">No explanation for this question yet.</p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-bb-line px-6 py-4">
        <button className="bb-btn bb-btn-outline" onClick={onClose}>
          Review question
        </button>
        <button className="bb-btn bb-btn-primary" onClick={onNext}>
          {nextLabel}
        </button>
      </div>
    </Modal>
  );
}

export function PracticeRunner({ bank }: { bank: Question[] }) {
  const router = useRouter();
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const [session, setSession] = useState<PracticeSession | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [strike, setStrike] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const s = getActive("practice");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from localStorage after mount
    setSession(s?.mode === "practice" ? s : null);
    setName(getSettings().name);
  }, []);

  useEffect(() => {
    if (session) saveSession(session);
  }, [session]);

  const updateModule = useCallback((fn: (m: ModuleState) => ModuleState) => {
    setSession((s) => (s ? { ...s, module: fn(s.module) } : s));
  }, []);

  const running = !!session && !session.finishedAt;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setSession((s) => (s ? { ...s, elapsed: s.elapsed + 1, module: addTime(s.module, 1000) } : s));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  if (session === undefined) return null;
  if (session === null)
    return <CenterMessage title="No practice set in progress">Start one from the home page.</CenterMessage>;
  if (session.finishedAt) return <p className="p-10 text-center font-semibold">Opening results…</p>;

  const m = session.module;
  const qid = currentId(m);
  const q = byId.get(qid);
  const item = m.items[qid] ?? { timeMs: 0 };
  const last = m.index === m.questionIds.length - 1;
  const title = `Practice: ${session.title}`;
  const finish = () => {
    const done = { ...session, finishedAt: Date.now() };
    saveSession(done);
    setSession(done);
    router.push(`/results?id=${done.id}`);
  };
  const next = () => (last ? finish() : updateModule((x) => goTo(x, x.index + 1)));

  return (
    <TestShell
      title={title}
      navTitle={`${title} — Questions`}
      name={name}
      seconds={session.elapsed}
      timerHidden={session.timerHidden}
      timerLocked={false}
      onToggleTimer={() => setSession({ ...session, timerHidden: !session.timerHidden })}
      moreItems={[
        { label: "Finish Set", onClick: finish },
        { label: "Save and Exit", onClick: () => router.push("/") },
      ]}
      index={m.index}
      total={m.questionIds.length}
      cells={gridCells(m)}
      onJump={(i) => updateModule((x) => goTo(x, i))}
      buttons={
        <>
          {m.index > 0 && (
            <button className="bb-btn bb-btn-primary" onClick={() => updateModule((x) => goTo(x, x.index - 1))}>
              Back
            </button>
          )}
          {item.answer && !item.checked ? (
            <button
              className="bb-btn bb-btn-primary"
              onClick={() => {
                updateModule((x) => patchItem(x, qid, { checked: true }));
                setShowResult(true);
              }}
            >
              Check
            </button>
          ) : (
            <button className="bb-btn bb-btn-primary" onClick={next}>
              {last ? "Finish" : "Next"}
            </button>
          )}
        </>
      }
    >
      {q ? (
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
          locked={!!item.checked}
          reveal={item.checked && q.type === "mcq" ? { correctLetter: q.answer } : null}
        />
      ) : (
        <CenterMessage title="Question not found">This question was removed from the bank.</CenterMessage>
      )}
      {showResult && q && (
        <ResultModal
          q={q}
          answer={item.answer}
          timeMs={item.timeMs}
          onClose={() => setShowResult(false)}
          onNext={() => {
            setShowResult(false);
            next();
          }}
          nextLabel={last ? "Finish" : "Next"}
        />
      )}
    </TestShell>
  );
}
