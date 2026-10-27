import { entryToTex, isGridCorrect, maxLength, parseValue } from "./grid";
import type { ItemState, Question } from "./types";

export const MODULE_SECONDS = 35 * 60;
export const MODULE_SIZE = 22;

export type ModuleState = {
  questionIds: string[];
  items: Record<string, ItemState>;
  index: number;
  onReview: boolean;
  secondsLeft: number;
  submittedAt?: number;
};

export type ExamSession = {
  id: string;
  mode: "exam";
  createdAt: number;
  adaptive: boolean;
  current: number;
  modules: ModuleState[];
  route?: "harder" | "easier";
  /** Timed custom set: one module, no feedback until the end. Holds the set's title. */
  custom?: string;
  timerHidden: boolean;
  finishedAt?: number;
  /** Set once the finished session has been saved to the database. */
  syncedAt?: number;
};

export type PracticeSession = {
  id: string;
  mode: "practice";
  createdAt: number;
  title: string;
  module: ModuleState;
  elapsed: number;
  timerHidden: boolean;
  finishedAt?: number;
  syncedAt?: number;
};

export type Session = ExamSession | PracticeSession;

export type Settings = { name: string };

const KEY = "mather:v1";
/** Finished sessions kept in the browser once they're in the database. */
const KEEP_SYNCED = 30;

type Store = {
  settings: Settings;
  sessions: Record<string, Session>;
  active: { exam?: string; practice?: string };
};

function empty(): Store {
  return { settings: { name: "" }, sessions: {}, active: {} };
}

export function loadStore(): Store {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}

function saveStore(s: Store) {
  const synced = Object.values(s.sessions)
    .filter((x) => x.syncedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  for (const x of synced.slice(KEEP_SYNCED)) delete s.sessions[x.id];
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage full or blocked; progress just won't survive a reload
  }
}

export function getSettings(): Settings {
  return loadStore().settings;
}

export function saveSettings(settings: Settings) {
  const s = loadStore();
  s.settings = settings;
  saveStore(s);
}

export function getSession(id: string): Session | undefined {
  return loadStore().sessions[id];
}

export function saveSession(session: Session) {
  const s = loadStore();
  s.sessions[session.id] = session;
  if (session.finishedAt) {
    if (s.active[session.mode] === session.id) delete s.active[session.mode];
  } else {
    s.active[session.mode] = session.id;
  }
  saveStore(s);
}

export function getActive(mode: Session["mode"]): Session | undefined {
  const s = loadStore();
  const id = s.active[mode];
  return id ? s.sessions[id] : undefined;
}

export function clearActive(mode: Session["mode"]) {
  const s = loadStore();
  delete s.active[mode];
  saveStore(s);
}

export function listFinished(): Session[] {
  return Object.values(loadStore().sessions)
    .filter((x) => x.finishedAt)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
}

export function markSynced(ids: string[], at = Date.now()) {
  const s = loadStore();
  for (const id of ids) {
    const x = s.sessions[id];
    if (x?.finishedAt) x.syncedAt = at;
  }
  saveStore(s);
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function newModule(questionIds: string[], seconds = MODULE_SECONDS): ModuleState {
  return {
    questionIds,
    items: Object.fromEntries(questionIds.map((id) => [id, { timeMs: 0 }])),
    index: 0,
    onReview: false,
    secondsLeft: seconds,
  };
}

export function newPracticeSession(title: string, questionIds: string[]): PracticeSession {
  return {
    id: newId(),
    mode: "practice",
    createdAt: Date.now(),
    title,
    module: newModule(questionIds, 0),
    elapsed: 0,
    timerHidden: false,
  };
}

export function newExamSession(adaptive: boolean, module1Ids: string[]): ExamSession {
  return {
    id: newId(),
    mode: "exam",
    createdAt: Date.now(),
    adaptive,
    current: 0,
    modules: [newModule(module1Ids)],
    timerHidden: false,
  };
}

/** Same time per question as the real test (35 minutes for 22), rounded up to the minute. */
export function timedSeconds(count: number) {
  return Math.ceil((count * MODULE_SECONDS) / MODULE_SIZE / 60) * 60;
}

export function newTimedSession(title: string, questionIds: string[]): ExamSession {
  return {
    id: newId(),
    mode: "exam",
    createdAt: Date.now(),
    adaptive: false,
    current: 0,
    modules: [newModule(questionIds, timedSeconds(questionIds.length))],
    custom: title,
    timerHidden: false,
  };
}

export function sessionLabel(s: Pick<Session, "mode"> & { title?: string; custom?: string }) {
  if (s.mode === "practice") return `Practice: ${s.title}`;
  return s.custom ? `Timed set: ${s.custom}` : "Full exam";
}

export function sessionModules(s: Session): ModuleState[] {
  return s.mode === "exam" ? s.modules : [s.module];
}

export function sessionScore(s: Session, byId: Map<string, Question>) {
  return sessionModules(s).reduce(
    (acc, m) => {
      const x = moduleScore(m, byId);
      return { correct: acc.correct + x.correct, total: acc.total + x.total };
    },
    { correct: 0, total: 0 },
  );
}

export function isCorrect(q: Question, answer: string | undefined) {
  if (!answer) return false;
  if (q.type === "mcq") return answer === q.answer;
  return isGridCorrect(answer, q.gridAnswers ?? []);
}

/** LaTeX for the correct answer(s), for feedback and results screens. */
export function correctAnswerTex(q: Question) {
  if (q.type === "mcq") return answerTex(q, q.answer);
  return (q.gridAnswers ?? [])
    .map((a) => {
      const v = parseValue(a);
      // Fractions too long for the answer box also show the decimal to enter.
      if (v && a.includes("/") && a.length > maxLength(a)) {
        return `${entryToTex(a)} \\approx ${(Number(v.n) / Number(v.d)).toFixed(3).replace(/\.?0+$/, "")}`;
      }
      return entryToTex(a);
    })
    .join(",\\ ");
}

/** LaTeX for a student's answer (choice letters in upright type). */
export function answerTex(q: Question, answer: string | undefined) {
  if (!answer) return "";
  return q.type === "mcq" ? `\\text{${answer}}` : entryToTex(answer);
}

export function moduleScore(m: ModuleState, byId: Map<string, Question>) {
  let correct = 0;
  for (const id of m.questionIds) {
    const q = byId.get(id);
    if (q && isCorrect(q, m.items[id]?.answer)) correct++;
  }
  return { correct, total: m.questionIds.length };
}
