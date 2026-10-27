"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildModule, filterQuestions, shuffle } from "@/lib/select";
import {
  clearActive,
  getActive,
  getSettings,
  listFinished,
  moduleScore,
  newExamSession,
  newPracticeSession,
  saveSession,
  saveSettings,
  type ModuleState,
  type Session,
} from "@/lib/session";
import { DIFFICULTIES, DOMAINS, type Difficulty, type Domain, type Question } from "@/lib/types";

function answered(m: ModuleState) {
  return m.questionIds.filter((id) => m.items[id]?.answer).length;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-bb-line bg-white p-6 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ on, label, onClick, count }: { on: boolean; label: string; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
        on ? "border-bb-blue bg-bb-blue text-white" : "border-bb-line bg-white hover:border-bb-ink"
      }`}
    >
      {label}
      {count !== undefined && <span className={on ? "text-white/80" : "text-bb-muted"}> · {count}</span>}
    </button>
  );
}

export function Home({ bank }: { bank: Question[] }) {
  const router = useRouter();
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [activePractice, setActivePractice] = useState<Session | undefined>();
  const [activeExam, setActiveExam] = useState<Session | undefined>();
  const [history, setHistory] = useState<Session[]>([]);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [diffs, setDiffs] = useState<Difficulty[]>([]);
  const [types, setTypes] = useState<Question["type"][]>([]);
  const [count, setCount] = useState(10);
  const [adaptive, setAdaptive] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from localStorage after mount */
    setName(getSettings().name);
    setActivePractice(getActive("practice"));
    setActiveExam(getActive("exam"));
    setHistory(listFinished().slice(0, 8));
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const pool = useMemo(() => filterQuestions(bank, { domains, difficulties: diffs, types }), [bank, domains, diffs, types]);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const examPool = bank.filter((q) => !q.flag);

  const startPractice = () => {
    const ids = shuffle(pool)
      .slice(0, Math.max(1, Math.min(count, pool.length)))
      .map((q) => q.id);
    const title =
      domains.length === 1 ? domains[0] : domains.length ? `${domains.length} domains` : "Mixed Math";
    saveSession(newPracticeSession(title, ids));
    router.push("/practice");
  };

  const startExam = () => {
    saveSession(newExamSession(adaptive, buildModule(examPool, "standard")));
    router.push("/exam");
  };

  const discard = (mode: Session["mode"]) => {
    clearActive(mode);
    if (mode === "exam") setActiveExam(undefined);
    else setActivePractice(undefined);
  };

  const domainCount = (d: Domain) => bank.filter((q) => q.domain === d).length;
  const diffCount = (d: Difficulty) => bank.filter((q) => q.difficulty === d).length;

  return (
    <div className="min-h-dvh bg-[#f6f7fb]">
      <header className="border-b border-bb-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <span className="text-xl font-extrabold tracking-tight">mather</span>
          <span className="text-sm text-bb-muted">SAT Math practice · {bank.length} questions</span>
          <label className="ml-auto flex items-center gap-2 text-sm">
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
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:grid-cols-2">
        <Card title="Practice">
          {mounted && activePractice?.mode === "practice" && (
            <div className="mb-5 flex items-center gap-3 rounded-lg bg-bb-blue-soft px-4 py-3 text-sm">
              <span className="flex-1">
                <strong>In progress:</strong> {activePractice.title} · {answered(activePractice.module)}/
                {activePractice.module.questionIds.length} answered
              </span>
              <button className="font-semibold text-bb-red hover:underline" onClick={() => discard("practice")}>
                Discard
              </button>
              <Link href="/practice" className="bb-btn bb-btn-primary !px-4 !py-1.5 text-sm">
                Resume
              </Link>
            </div>
          )}
          <p className="mb-2 text-sm font-semibold text-bb-muted">Domain</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {DOMAINS.filter((d) => domainCount(d) > 0).map((d) => (
              <Toggle key={d} label={d} count={domainCount(d)} on={domains.includes(d)} onClick={() => setDomains(toggle(domains, d))} />
            ))}
          </div>
          <p className="mb-2 text-sm font-semibold text-bb-muted">Difficulty</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {DIFFICULTIES.filter((d) => diffCount(d) > 0).map((d) => (
              <Toggle key={d} label={d} count={diffCount(d)} on={diffs.includes(d)} onClick={() => setDiffs(toggle(diffs, d))} />
            ))}
          </div>
          <p className="mb-2 text-sm font-semibold text-bb-muted">Type</p>
          <div className="mb-5 flex flex-wrap gap-2">
            <Toggle label="Multiple choice" on={types.includes("mcq")} onClick={() => setTypes(toggle(types, "mcq"))} />
            <Toggle label="Grid-in" on={types.includes("spr")} onClick={() => setTypes(toggle(types, "spr"))} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              Questions
              <input
                type="number"
                min={1}
                max={pool.length}
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || 1)}
                className="w-20 rounded-md border border-bb-line px-2 py-1.5"
              />
            </label>
            <span className="text-sm text-bb-muted">of {pool.length} matching</span>
            <button className="bb-btn bb-btn-primary ml-auto" disabled={!pool.length} onClick={startPractice}>
              Start practice
            </button>
          </div>
        </Card>

        <Card title="Full exam">
          {mounted && activeExam?.mode === "exam" && (
            <div className="mb-5 flex items-center gap-3 rounded-lg bg-bb-blue-soft px-4 py-3 text-sm">
              <span className="flex-1">
                <strong>In progress:</strong> Module {activeExam.current + 1} ·{" "}
                {Math.ceil(activeExam.modules[activeExam.current].secondsLeft / 60)} min left
              </span>
              <button className="font-semibold text-bb-red hover:underline" onClick={() => discard("exam")}>
                Discard
              </button>
              <Link href="/exam" className="bb-btn bb-btn-primary !px-4 !py-1.5 text-sm">
                Resume
              </Link>
            </div>
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
          {mounted && history.length === 0 && <p className="text-sm text-bb-muted">Nothing yet. Finish a set or an exam to see it here.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {history.map((s) => {
              const modules = s.mode === "exam" ? s.modules : [s.module];
              const score = modules.reduce(
                (acc, m) => {
                  const x = moduleScore(m, byId);
                  return { c: acc.c + x.correct, t: acc.t + x.total };
                },
                { c: 0, t: 0 },
              );
              return (
                <Link
                  key={s.id}
                  href={`/results?id=${s.id}`}
                  className="flex items-center gap-4 rounded-xl border border-bb-line bg-white px-5 py-4 hover:border-bb-blue"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{s.mode === "exam" ? "Full exam" : `Practice: ${s.title}`}</div>
                    <div className="text-sm text-bb-muted">{new Date(s.finishedAt ?? s.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-xl font-bold">
                    {score.c}/{score.t}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
