"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronLeft, LayoutGrid, ListChecks } from "lucide-react";
import { AppGlass } from "../AppGlass";
import { BookmarkIcon, CheckCircle, XCircle } from "../bluebook/icons";
import { formatClock } from "../bluebook/TopBar";
import { LocalDate } from "../LocalDate";
import { Rich, RichInline } from "../Rich";
import { GlassSegment, type GlassView } from "../ui/adjustable-glass-dashboard";
import { Sections, type SectionPick } from "./Sections";
import { hasStatus, type ProgressMap, type QuestionProgress, type Status } from "@/lib/attempts";
import { formatRanges, inRanges, parseNumberRanges } from "@/lib/numbers";
import { tex } from "@/lib/rich";
import { shuffle } from "@/lib/select";
import {
  answerTex,
  correctAnswerTex,
  getActive,
  newPracticeSession,
  newTimedSession,
  saveSession,
  sessionLabel,
  timedSeconds,
} from "@/lib/session";
import { useProgress } from "@/lib/useProgress";
import {
  DIFFICULTIES,
  DOMAINS,
  EBRW_DOMAINS,
  LETTERS,
  MATH_DOMAINS,
  SKILLS,
  subjectOf,
  type Difficulty,
  type Domain,
  type Question,
  type Subject,
} from "@/lib/types";

// ---------- Filters (kept in the URL so a filtered view can be linked to) ----------

type Filters = {
  status: Status[];
  domain: Domain[];
  skill: string[];
  difficulty: Difficulty[];
  type: Question["type"][];
  source: string[];
  /** Question numbers, e.g. "10-20, 34" (at most one value). */
  num: string[];
};
type Group = keyof Filters;
const GROUPS: Group[] = ["status", "domain", "skill", "difficulty", "type", "source", "num"];
const NO_FILTERS: Filters = { status: [], domain: [], skill: [], difficulty: [], type: [], source: [], num: [] };

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "unanswered", label: "Unanswered" },
  { value: "incorrect", label: "Incorrect" },
  { value: "correct", label: "Correct" },
  { value: "marked", label: "Marked for review" },
];
const TYPE_LABEL: Record<Question["type"], string> = { mcq: "Multiple choice", spr: "Grid-in" };

type SubjectParam = "math" | "ebrw";
const SUBJECT_TO_PARAM: Record<Subject, SubjectParam> = {
  Math: "math",
  "Reading and Writing": "ebrw",
};
const SUBJECT_OPTIONS = [
  ["Math", "Math"],
  ["Reading and Writing", "Reading & Writing"],
] as const satisfies readonly (readonly [Subject, string])[];

function readFilters(params: URLSearchParams): Filters {
  const f = {} as Filters;
  for (const g of GROUPS) (f[g] as string[]) = params.getAll(g);
  return f;
}

/** History entries opened from the sections, so "Sections" can step back instead of piling up. */
const FROM_SECTIONS = "matherFromSections";

function writeFilters(f: Filters, how: "replace" | "push" = "replace", subjectParam?: SubjectParam | null) {
  const p = new URLSearchParams();
  if (subjectParam) p.set("subject", subjectParam);
  for (const g of GROUPS) for (const v of f[g]) p.append(g, v);
  // A bare /bank (or /bank?subject=...) shows the sections, so a full list with nothing picked uses ?all.
  const hasFilters = GROUPS.some((g) => f[g].length > 0);
  if (!hasFilters) p.set("all", "");
  const qs = p.toString().replace(/=(?=&|$)/g, "");
  const url = `?${qs}`;
  // Native history updates keep useSearchParams in sync without a server round trip.
  if (how === "push") window.history.pushState({ [FROM_SECTIONS]: true }, "", url);
  else window.history.replaceState({ [FROM_SECTIONS]: window.history.state?.[FROM_SECTIONS] }, "", url);
}

function valueMatches(g: Group, v: string, q: Question, progress: ProgressMap) {
  switch (g) {
    case "status":
      return hasStatus(progress[q.id], v as Status);
    case "domain":
      return q.domain === v;
    case "skill":
      return q.skill === v;
    case "difficulty":
      return q.difficulty === v;
    case "type":
      return q.type === v;
    case "source":
      return q.source === v;
    case "num":
      return inRanges(q.sourceNumber, parseNumberRanges(v) ?? []);
  }
}

/** Options within a group are OR'ed, groups are AND'ed. `except` skips one group (for facet counts). */
function matches(q: Question, f: Filters, progress: ProgressMap, except?: Group) {
  return GROUPS.every((g) => g === except || !f[g].length || f[g].some((v) => valueMatches(g, v, q, progress)));
}

function setTitle(f: Filters, subjectScope: Subject | null) {
  const parts: string[] = [];
  if (f.skill.length === 1) parts.push(f.skill[0]);
  else if (f.domain.length === 1 && !f.skill.length) parts.push(f.domain[0]);
  else if (f.domain.length || f.skill.length) parts.push("Mixed topics");
  if (f.difficulty.length === 1) parts.push(f.difficulty[0]);
  if (f.status.length === 1) parts.push(STATUS_OPTIONS.find((o) => o.value === f.status[0])!.label);
  if (f.num.length) parts.push(`#${f.num[0]}`);
  if (parts.length) return parts.join(" · ");
  if (subjectScope === "Reading and Writing") return "Mixed Reading & Writing";
  if (subjectScope === "Math") return "Mixed Math";
  return "Mixed SAT";
}

// ---------- Small pieces ----------

type Option = { value: string; label: string; count: number; on: boolean; strong?: boolean; indent?: boolean };

/** A filter button that opens a list of checkable options with counts. */
function FilterMenu({
  label,
  options,
  onToggle,
  onClear,
}: {
  label: string;
  options: Option[];
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const picked = options.filter((o) => o.on);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="sm:relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`gw-chip ${picked.length ? "is-on" : ""}`}
      >
        <span className="max-w-[14rem] truncate">
          {picked.length === 1 ? picked[0].label : picked.length ? `${label} · ${picked.length}` : label}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="gw-menu">
          {options.map((o) => (
            <label
              key={o.value}
              className={`${o.indent ? "is-indent" : ""} ${o.strong ? "is-strong" : ""} ${!o.count && !o.on ? "is-empty" : ""}`}
            >
              <input type="checkbox" checked={o.on} onChange={() => onToggle(o.value)} />
              <span>{o.label}</span>
              <span className="tabular-nums">{o.count}</span>
            </label>
          ))}
          {picked.length > 0 && <button onClick={onClear}>Clear</button>}
        </div>
      )}
    </div>
  );
}

export function StatusIcon({ p, size = 22 }: { p?: QuestionProgress; size?: number }) {
  if (!p)
    return (
      <span
        role="img"
        aria-label="Not answered yet"
        title="Not answered yet"
        className="inline-block rounded-full border-[1.5px] border-dashed border-bb-faint"
        style={{ width: size - 2, height: size - 2 }}
      />
    );
  const label = `${p.last.correct ? "Correct" : "Incorrect"} last time · ${p.nCorrect}/${p.n} correct overall`;
  // The icons are hidden from screen readers by default; these ones carry the status.
  const Icon = p.last.correct ? CheckCircle : XCircle;
  return (
    <Icon
      width={size}
      height={size}
      className={p.last.correct ? "text-bb-green" : "text-bb-red"}
      role="img"
      aria-hidden={false}
      aria-label={label}
    />
  );
}

function Detail({ q, p, onPractice }: { q: Question; p?: QuestionProgress; onPractice: () => void }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="gw-qdetail space-y-5">
      <Rich src={q.stem} />
      {q.type === "mcq" ? (
        <ol className="space-y-2">
          {(q.choices ?? []).map((c, i) => {
            const l = LETTERS[i];
            const good = reveal && l === q.answer;
            return (
              <li
                key={l}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  good ? "border-bb-green bg-bb-green-soft" : "border-bb-hair bg-bb-surface"
                }`}
              >
                <span className="bb-letter">{l}</span>
                <div className="flex-1">
                  <Rich src={c} className="!text-[16px]" />
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-bb-muted">Grid-in: you type the answer.</p>
      )}
      {q.flag && (
        <div className="rounded-lg bg-bb-amber-soft px-4 py-3 text-sm">
          <strong>Source issue: </strong>
          <RichInline src={q.flag} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button className="gw-button" onClick={onPractice}>
          Practice this question
        </button>
        <button className="text-sm font-semibold text-bb-muted hover:text-bb-ink" onClick={() => setReveal((v) => !v)}>
          {reveal ? "Hide answer" : "Show answer and explanation"}
        </button>
        <span className="ml-auto text-xs text-bb-muted">
          {q.domain} · {q.source} #{q.sourceNumber}
          {q.page ? ` · page ${q.page}` : ""}
        </span>
      </div>

      {reveal && (
        <div className="space-y-3 border-t border-bb-hair pt-4">
          <p className="text-[15px]">
            <span className="font-semibold">Correct answer: </span>
            <span dangerouslySetInnerHTML={{ __html: tex(correctAnswerTex(q)) }} />
          </p>
          {q.explanation ? (
            <Rich src={q.explanation} className="!text-[16px]" />
          ) : (
            <p className="text-sm text-bb-muted">No explanation yet.</p>
          )}
        </div>
      )}

      <div>
        <h4 className="mb-2 text-sm font-semibold">
          Your attempts{p ? ` · ${p.nCorrect}/${p.n} correct` : ""}
        </h4>
        {!p ? (
          <p className="text-sm text-bb-muted">Not attempted yet.</p>
        ) : (
          <table className="w-full max-w-xl text-sm">
            <tbody>
              {p.history.map((a) => (
                <tr key={a.id} className="border-t border-bb-hair first:border-0">
                  <td className="py-1.5 pr-3 text-bb-muted">
                    <LocalDate ms={a.createdAt} />
                  </td>
                  <td className="py-1.5 pr-3">{a.mode === "exam" ? "Test" : "Practice"}</td>
                  <td className="py-1.5 pr-3">
                    {a.answer ? (
                      <span dangerouslySetInnerHTML={{ __html: tex(answerTex(q, a.answer)) }} />
                    ) : (
                      <span className="text-bb-muted">blank</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3">
                    {a.correct ? (
                      <CheckCircle width={18} height={18} className="text-bb-green" />
                    ) : (
                      <XCircle width={18} height={18} className="text-bb-red" />
                    )}
                  </td>
                  <td className="py-1.5 pr-3 tabular-nums">{formatClock(a.timeMs / 1000)}</td>
                  <td className="py-1.5">
                    {a.marked && <BookmarkIcon filled width={16} height={16} className="text-bb-red" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {p && p.n > p.history.length && (
          <p className="mt-1 text-xs text-bb-muted">Showing the latest {p.history.length}.</p>
        )}
      </div>
    </div>
  );
}

// ---------- Page ----------

const PAGE = 30;

export function Bank({
  bank,
  progress: serverProgress,
  notice,
}: {
  bank: Question[];
  progress: ProgressMap | null;
  notice?: React.ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const progress = useProgress(serverProgress, byId);
  const filters = useMemo(() => readFilters(new URLSearchParams(params.toString())), [params]);

  const rawSubject = params.get("subject");
  const urlSubjectParam: SubjectParam | null = rawSubject === "ebrw" ? "ebrw" : rawSubject === "math" ? "math" : null;
  const activeSubject: Subject = urlSubjectParam === "ebrw" ? "Reading and Writing" : "Math";

  // Any filter param or ?all opens the question list; bare /bank or /bank?subject=... shows the sections.
  const anyFilter = GROUPS.some((g) => filters[g].length > 0);
  const browsing = anyFilter || params.has("all");

  // Infer subject scope in question-list view: explicit URL subject, or inferred if all filtered domains/skills belong to one subject.
  const listSubjectScope: Subject | null = useMemo(() => {
    if (urlSubjectParam === "ebrw") return "Reading and Writing";
    if (urlSubjectParam === "math") return "Math";
    if (filters.domain.length > 0 || filters.skill.length > 0) {
      const ds = new Set<Subject>();
      for (const d of filters.domain) ds.add(subjectOf(d));
      for (const s of filters.skill) {
        const owner = DOMAINS.find((d) => SKILLS[d].includes(s));
        if (owner) ds.add(subjectOf(owner));
      }
      if (ds.size === 1) return [...ds][0];
    }
    return null;
  }, [urlSubjectParam, filters.domain, filters.skill]);

  const scopedBank = useMemo(() => {
    if (!browsing) return bank.filter((q) => subjectOf(q.domain) === activeSubject);
    if (urlSubjectParam === "ebrw") return bank.filter((q) => subjectOf(q.domain) === "Reading and Writing");
    if (urlSubjectParam === "math") return bank.filter((q) => subjectOf(q.domain) === "Math");
    return bank;
  }, [bank, browsing, activeSubject, urlSubjectParam]);

  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [mode, setMode] = useState<"practice" | "timed">("practice");
  // Chosen numbers default to book order, including when they come from a link.
  const [order, setOrder] = useState<"random" | "book">(filters.num.length ? "book" : "random");
  const [count, setCount] = useState(10);
  const [numText, setNumText] = useState(filters.num[0] ?? "");

  const sorted = useMemo(
    () =>
      [...scopedBank].sort(
        (a, b) =>
          a.source.localeCompare(b.source) ||
          DOMAINS.indexOf(a.domain) - DOMAINS.indexOf(b.domain) ||
          a.sourceNumber - b.sourceNumber,
      ),
    [scopedBank],
  );
  const shown = useMemo(() => sorted.filter((q) => matches(q, filters, progress)), [sorted, filters, progress]);
  const facet = (g: Group, v: string) =>
    scopedBank.filter((q) => matches(q, filters, progress, g) && valueMatches(g, v, q, progress)).length;

  const update = (g: Group, v: string) => {
    const list = filters[g] as string[];
    const next = { ...filters, [g]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] } as Filters;
    // Dropping a domain also drops its skills.
    if (g === "domain" && list.includes(v)) next.skill = next.skill.filter((s) => !SKILLS[v as Domain].includes(s));
    writeFilters(next, "replace", urlSubjectParam);
    setLimit(PAGE);
    setOpen(null);
  };
  const clear = () => {
    writeFilters(NO_FILTERS, "replace", urlSubjectParam);
    setNumText("");
    setLimit(PAGE);
  };
  // Question numbers: applied once the text reads as numbers; a chosen run is practiced whole, in book order.
  const numBad = parseNumberRanges(numText) === null;
  const setNumbers = (text: string) => {
    setNumText(text);
    const ranges = parseNumberRanges(text);
    if (ranges === null) return;
    writeFilters({ ...filters, num: ranges.length ? [formatRanges(ranges)] : [] }, "replace", urlSubjectParam);
    if (ranges.length && !filters.num.length) setOrder("book");
    setLimit(PAGE);
    setOpen(null);
  };

  const switchSubject = (nextSubject: Subject) => {
    const url = nextSubject === "Reading and Writing" ? "?subject=ebrw" : window.location.pathname;
    window.history.replaceState(window.history.state, "", url);
  };

  // Into the list from the sections (a new history entry, so Back returns), and out again.
  const browse = (pick: Partial<Filters>, subjectScope: SubjectParam | null = urlSubjectParam) => {
    writeFilters({ ...NO_FILTERS, ...pick }, "push", subjectScope);
    setNumText("");
    setOrder("random");
    setLimit(PAGE);
    setOpen(null);
    window.scrollTo(0, 0);
  };
  const toSections = () => {
    if (window.history.state?.[FROM_SECTIONS]) return window.history.back();
    const backUrl = listSubjectScope === "Reading and Writing" ? "?subject=ebrw" : window.location.pathname;
    window.history.pushState(null, "", backUrl);
    window.scrollTo(0, 0);
  };

  const allowedDomains = useMemo(() => {
    if (listSubjectScope === "Reading and Writing") return EBRW_DOMAINS;
    if (listSubjectScope === "Math") return MATH_DOMAINS;
    return DOMAINS;
  }, [listSubjectScope]);

  // A picked section stays in the Topic menu even before it has questions.
  const domains = allowedDomains.filter((d) => filters.domain.includes(d) || scopedBank.some((q) => q.domain === d));
  const difficulties = DIFFICULTIES.filter((d) => scopedBank.some((q) => q.difficulty === d));
  const sources = [...new Set(scopedBank.map((q) => q.source))];
  const hasSpr = scopedBank.some((q) => q.type === "spr");

  const pool = mode === "timed" ? shown.filter((q) => !q.flag) : shown;
  const byNumber = filters.num.length > 0;
  const n = byNumber ? pool.length : Math.max(1, Math.min(count || 1, pool.length));
  const title = setTitle(filters, listSubjectScope);
  // Numbers restart in each chapter (and book), so the list is headed by chapter when it spans several.
  const chapter = (q: Question) => (sources.length > 1 ? `${q.source} · ${q.domain}` : q.domain);
  const chapters = [...new Set(shown.map(chapter))];

  const start = (ids: string[], kind: "practice" | "timed", name: string) => {
    const existing = getActive(kind === "timed" ? "exam" : "practice");
    if (existing && !confirm(`"${sessionLabel(existing)}" is still in progress. Start a new one instead?`)) return;
    saveSession(kind === "timed" ? newTimedSession(name, ids) : newPracticeSession(name, ids));
    router.push(kind === "timed" ? "/exam" : "/practice");
  };
  const startSet = () => {
    let picked = order === "book" ? pool.slice(0, n) : shuffle(pool).slice(0, n);
    // Timed sets run easy → hard, like a real module.
    if (mode === "timed") {
      picked = [...picked].sort((a, b) => DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty));
    }
    start(
      picked.map((q) => q.id),
      mode,
      title,
    );
  };

  const menu = (g: Group, values: { value: string; label: string }[]): Option[] =>
    values.map((v) => ({ ...v, count: facet(g, v.value), on: (filters[g] as string[]).includes(v.value) }));
  const clearGroup = (...gs: Group[]) => {
    const next = { ...filters };
    for (const g of gs) (next[g] as string[]) = [];
    writeFilters(next, "replace", urlSubjectParam);
    setLimit(PAGE);
  };
  // Topics: each domain, then its skills. Picking a skill narrows within its domain.
  const topicOptions: Option[] = domains.flatMap((d) => [
    { value: `d:${d}`, label: d, count: facet("domain", d), on: filters.domain.includes(d), strong: true },
    ...SKILLS[d]
      .filter((sk) => filters.skill.includes(sk) || scopedBank.some((q) => q.skill === sk))
      .map((sk) => ({ value: `s:${sk}`, label: sk, count: facet("skill", sk), on: filters.skill.includes(sk), indent: true })),
  ]);

  // Nothing in the picked section or topic yet (as opposed to filters that leave nothing).
  const emptyTopic =
    (filters.domain.length > 0 || filters.skill.length > 0) &&
    !scopedBank.some((q) => matches(q, { ...NO_FILTERS, domain: filters.domain, skill: filters.skill }, progress));

  const sections = (
    <Sections
      subject={activeSubject}
      bank={scopedBank}
      progress={progress}
      onPick={(pick: SectionPick) =>
        browse("skill" in pick ? { skill: [pick.skill] } : { domain: [pick.domain] }, SUBJECT_TO_PARAM[activeSubject])
      }
    />
  );

  const questions = (
    <>
      {/* Filters, then a set from whatever they leave. Raised so the filter menus open over the list. */}
      <section className="gw-panel gw-reveal gw-raise">
        {/* One row of menus. Groups with a single value (all "Hard", one book) are left out. */}
        <div className="relative flex flex-wrap items-center gap-2">
          <FilterMenu
            label="Status"
            options={menu("status", STATUS_OPTIONS)}
            onToggle={(v) => update("status", v)}
            onClear={() => clearGroup("status")}
          />
          <FilterMenu
            label="Topic"
            options={topicOptions}
            onToggle={(v) => update(v.startsWith("d:") ? "domain" : "skill", v.slice(2))}
            onClear={() => clearGroup("domain", "skill")}
          />
          {difficulties.length > 1 && (
            <FilterMenu
              label="Difficulty"
              options={menu("difficulty", difficulties.map((d) => ({ value: d, label: d })))}
              onToggle={(v) => update("difficulty", v)}
              onClear={() => clearGroup("difficulty")}
            />
          )}
          {hasSpr && (
            <FilterMenu
              label="Type"
              options={menu("type", (["mcq", "spr"] as const).map((t) => ({ value: t, label: TYPE_LABEL[t] })))}
              onToggle={(v) => update("type", v)}
              onClear={() => clearGroup("type")}
            />
          )}
          {sources.length > 1 && (
            <FilterMenu
              label="Source"
              options={menu("source", sources.map((x) => ({ value: x, label: x })))}
              onToggle={(v) => update("source", v)}
              onClear={() => clearGroup("source")}
            />
          )}
          <label className={`gw-chip ${byNumber && !numBad ? "is-on" : ""} ${numBad ? "is-bad" : ""}`}>
            <span>#</span>
            <input
              value={numText}
              onChange={(e) => setNumbers(e.target.value)}
              placeholder="e.g. 10-20"
              aria-label="Question numbers"
              aria-invalid={numBad}
            />
          </label>
          {anyFilter && (
            <button onClick={clear} className="gw-text-button px-2">
              Clear all
            </button>
          )}
        </div>
        {numBad && <p className="gw-negative mt-2 text-[13px]">Type question numbers like 10-20, 34, or 1-5, 12.</p>}

        <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-4 border-t border-[var(--gw-line)] pt-5">
          <div className="mr-auto">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {shown.length}
              <span className="ml-2 text-base font-normal text-[var(--gw-muted)]">{shown.length === 1 ? "question" : "questions"}</span>
            </p>
            {byNumber && chapters.length > 1 && (
              <p className="mt-1 text-[13px] text-[var(--gw-muted)]">
                {chapters.length === 2 ? `${chapters[0]} and ${chapters[1]} both have` : `${chapters.length} chapters have`} these
                numbers. Pick a Topic to choose one.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <GlassSegment
              value={mode}
              options={[
                ["practice", "Practice"],
                ["timed", "Timed"],
              ]}
              onChange={setMode}
              label="Set type"
            />
            {/* Chosen numbers are practiced whole, so the count only applies otherwise. */}
            {!byNumber && (
              <label className="flex items-center gap-2 text-[13px] text-[var(--gw-muted)]">
                <input
                  type="number"
                  min={1}
                  max={pool.length || 1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  aria-label="Questions"
                  className="gw-field w-16"
                />
                questions
              </label>
            )}
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as "random" | "book")}
              aria-label="Order"
              className="gw-field"
            >
              <option value="random">Random order</option>
              <option value="book">Book order</option>
            </select>
            <button className="gw-button" disabled={!pool.length} onClick={startSet}>
              {mode === "timed" ? `Start timed set · ${n}` : `Start practice · ${n}`}
            </button>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-[var(--gw-muted)]">
          {mode === "practice"
            ? "Check each answer as you go and see the explanation right away."
            : `${timedSeconds(n) / 60} minutes, no feedback until you submit, like a real module.`}
          {mode === "timed" && pool.length < shown.length && ` Flagged questions are left out.`}
        </p>
      </section>

      <section className="gw-panel gw-reveal mt-4">
        {shown.length === 0 && emptyTopic ? (
          <div className="gw-empty">
            <h3>No questions here yet</h3>
            <p>Add some from a book chapter or question bank on the Upload page.</p>
            <Link href="/upload">Upload</Link>
          </div>
        ) : shown.length === 0 ? (
          <div className="gw-empty">
            <h3>No questions match these filters</h3>
            <button onClick={clear}>Clear all filters</button>
          </div>
        ) : (
          <ul className="gw-qlist">
            {shown.slice(0, limit).map((q, i, list) => {
              const p = progress[q.id];
              const isOpen = open === q.id;
              const head = chapters.length > 1 && (i === 0 || chapter(list[i - 1]) !== chapter(q)) ? chapter(q) : null;
              return (
                <Fragment key={q.id}>
                  {head && <li className="gw-qhead">{head}</li>}
                  <li>
                    <button onClick={() => setOpen(isOpen ? null : q.id)} aria-expanded={isOpen} className="gw-qrow">
                      <span className="gw-qnum tabular-nums">{q.sourceNumber}</span>
                      <span className="gw-qskill">{q.skill}</span>
                      <span className="gw-qmeta">
                        {q.difficulty}
                        {q.type === "spr" && <span className="gw-qtag">Grid-in</span>}
                      </span>
                      <span className="gw-qstatus">
                        {p?.last.marked && (
                          <BookmarkIcon filled width={16} height={16} className="text-bb-red" role="img" aria-hidden={false} aria-label="Marked for review" />
                        )}
                        <StatusIcon p={p} size={18} />
                      </span>
                    </button>
                    {isOpen && <Detail q={q} p={p} onPractice={() => start([q.id], "practice", `Question ${q.sourceNumber}`)} />}
                  </li>
                </Fragment>
              );
            })}
          </ul>
        )}
        {shown.length > limit && (
          <button
            onClick={() => setLimit((l) => l + PAGE)}
            className="mt-2 w-full border-t border-[var(--gw-line)] pt-4 text-[13px] font-semibold text-[var(--gw-muted)] hover:text-[var(--gw-ink)]"
          >
            Show more ({shown.length - limit} left)
          </button>
        )}
      </section>
    </>
  );

  const views: GlassView[] = [
    {
      id: "sections",
      label: "Sections",
      icon: LayoutGrid,
      title: "Practice",
      eyebrow: "Open a section, then pick a topic",
      aside: (
        <div className="flex flex-wrap items-center gap-4">
          <GlassSegment
            value={activeSubject}
            options={SUBJECT_OPTIONS}
            onChange={switchSubject}
            label="Subject"
          />
          <button
            className="gw-text-button whitespace-nowrap"
            onClick={() => browse({}, SUBJECT_TO_PARAM[activeSubject])}
          >
            All {scopedBank.length} questions
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      ),
      content: browsing ? null : sections,
    },
    {
      id: "questions",
      label: "Questions",
      icon: ListChecks,
      title: anyFilter
        ? title
        : listSubjectScope === "Reading and Writing"
          ? "Reading & Writing"
          : listSubjectScope === "Math"
            ? "Math"
            : "All questions",
      eyebrow: (
        <button className="gw-back" onClick={toSections}>
          <ChevronLeft size={15} aria-hidden="true" />
          Sections
        </button>
      ),
      content: browsing ? questions : null,
    },
  ];

  return (
    <AppGlass
      active="bank"
      views={views}
      view={browsing ? "questions" : "sections"}
      onViewChange={(id) => {
        if (id === "sections" && browsing) toSections();
        else if (id === "questions" && !browsing) browse({}, SUBJECT_TO_PARAM[activeSubject]);
      }}
      banner={notice}
      footerNote={browsing ? "Status shows how your most recent attempt at each question went." : undefined}
    />
  );
}
