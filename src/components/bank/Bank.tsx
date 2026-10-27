"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "../AppHeader";
import { BookmarkIcon, CheckCircle, XCircle } from "../bluebook/icons";
import { formatClock } from "../bluebook/TopBar";
import { LocalDate } from "../LocalDate";
import { Rich, RichInline } from "../Rich";
import { hasStatus, type ProgressMap, type QuestionProgress, type Status } from "@/lib/attempts";
import { parseBlocks, tex } from "@/lib/rich";
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
import { DIFFICULTIES, DOMAINS, LETTERS, SKILLS, type Difficulty, type Domain, type Question } from "@/lib/types";

// ---------- Filters (kept in the URL so a filtered view can be linked to) ----------

type Filters = {
  status: Status[];
  domain: Domain[];
  skill: string[];
  difficulty: Difficulty[];
  type: Question["type"][];
  source: string[];
};
type Group = keyof Filters;
const GROUPS: Group[] = ["status", "domain", "skill", "difficulty", "type", "source"];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "unanswered", label: "Unanswered" },
  { value: "incorrect", label: "Incorrect" },
  { value: "correct", label: "Correct" },
  { value: "marked", label: "Marked for review" },
];
const TYPE_LABEL: Record<Question["type"], string> = { mcq: "Multiple choice", spr: "Grid-in" };

function readFilters(params: URLSearchParams): Filters {
  const f = {} as Filters;
  for (const g of GROUPS) (f[g] as string[]) = params.getAll(g);
  return f;
}

function writeFilters(f: Filters) {
  const p = new URLSearchParams();
  for (const g of GROUPS) for (const v of f[g]) p.append(g, v);
  const qs = p.toString();
  // Native history updates keep useSearchParams in sync without a server round trip.
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
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
  }
}

/** Options within a group are OR'ed, groups are AND'ed. `except` skips one group (for facet counts). */
function matches(q: Question, f: Filters, progress: ProgressMap, except?: Group) {
  return GROUPS.every((g) => g === except || !f[g].length || f[g].some((v) => valueMatches(g, v, q, progress)));
}

function setTitle(f: Filters) {
  const parts: string[] = [];
  if (f.skill.length === 1) parts.push(f.skill[0]);
  else if (f.domain.length === 1 && !f.skill.length) parts.push(f.domain[0]);
  else if (f.domain.length || f.skill.length) parts.push("Mixed topics");
  if (f.difficulty.length === 1) parts.push(f.difficulty[0]);
  if (f.status.length === 1) parts.push(STATUS_OPTIONS.find((o) => o.value === f.status[0])!.label);
  return parts.join(" · ") || "Mixed Math";
}

// ---------- Small pieces ----------

function Chip({
  on,
  label,
  count,
  onClick,
}: {
  on: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  const empty = count === 0 && !on;
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      disabled={empty}
      className={`rounded-full border px-3 py-1 text-[13px] font-semibold transition ${
        on
          ? "border-bb-blue bg-bb-blue text-white"
          : empty
            ? "cursor-default border-bb-bar bg-white text-[#a5a5a5]"
            : "border-bb-line bg-white hover:border-bb-ink"
      }`}
    >
      {label}
      <span className={on ? "text-white/80" : "text-bb-muted"}> {count}</span>
    </button>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-bb-bar py-4 first:pt-0 last:border-0 last:pb-0">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-bb-muted">{title}</h3>
      {children}
    </div>
  );
}

export function StatusIcon({ p, size = 22 }: { p?: QuestionProgress; size?: number }) {
  if (!p)
    return (
      <span
        title="Not answered yet"
        className="inline-block rounded-full border-[1.5px] border-dashed border-[#9a9a9a]"
        style={{ width: size - 2, height: size - 2 }}
      />
    );
  const label = `${p.last.correct ? "Correct" : "Incorrect"} last time · ${p.nCorrect}/${p.n} correct overall`;
  return p.last.correct ? (
    <CheckCircle width={size} height={size} className="text-bb-green" aria-label={label} />
  ) : (
    <XCircle width={size} height={size} className="text-bb-red" aria-label={label} />
  );
}

/** The opening text and equations of a question, run together on two lines. */
function Snippet({ stem }: { stem: string }) {
  const html = useMemo(() => {
    const parts: string[] = [];
    for (const b of parseBlocks(stem)) {
      if (b.t === "p") parts.push(b.html);
      // Single-line equations go inline; multi-line systems would just be clipped.
      else if (b.t === "math") {
        if (!b.src.includes("\\\\")) parts.push(tex(b.src));
      } else if (parts.length) break; // stop at the first figure or table after some text
      if (parts.length === 3) break;
    }
    return parts.join(" ");
  }, [stem]);
  return (
    <div
      className="rich line-clamp-2 !text-[15px] !leading-snug"
      dangerouslySetInnerHTML={{ __html: html || "<em>Figure</em>" }}
    />
  );
}

function Detail({ q, p, onPractice }: { q: Question; p?: QuestionProgress; onPractice: () => void }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="space-y-5 border-t border-bb-bar bg-[#fafbfe] px-5 py-5 sm:px-6">
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
                  good ? "border-bb-green bg-[#e7f5ef]" : "border-bb-line bg-white"
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
        <div className="rounded-lg border border-[#e6b800] bg-[#fff8d6] px-4 py-3 text-sm">
          <strong>Source issue: </strong>
          <RichInline src={q.flag} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className="bb-btn bb-btn-outline !py-1.5 text-sm" onClick={() => setReveal((v) => !v)}>
          {reveal ? "Hide answer" : "Show answer and explanation"}
        </button>
        <button className="bb-btn bb-btn-primary !py-1.5 text-sm" onClick={onPractice}>
          Practice this question
        </button>
        <span className="ml-auto text-xs text-bb-muted">
          {q.source} #{q.sourceNumber}
          {q.page ? ` · page ${q.page}` : ""}
        </span>
      </div>

      {reveal && (
        <div className="space-y-3 rounded-xl border border-bb-line bg-white p-4">
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
        <h4 className="mb-2 text-sm font-bold">
          Your attempts{p ? ` · ${p.nCorrect}/${p.n} correct` : ""}
        </h4>
        {!p ? (
          <p className="text-sm text-bb-muted">Not attempted yet.</p>
        ) : (
          <table className="w-full max-w-xl text-sm">
            <tbody>
              {p.history.map((a) => (
                <tr key={a.id} className="border-t border-bb-bar first:border-0">
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

  const [open, setOpen] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [mode, setMode] = useState<"practice" | "timed">("practice");
  const [order, setOrder] = useState<"random" | "book">("random");
  const [count, setCount] = useState(10);

  const sorted = useMemo(
    () =>
      [...bank].sort(
        (a, b) =>
          a.source.localeCompare(b.source) ||
          DOMAINS.indexOf(a.domain) - DOMAINS.indexOf(b.domain) ||
          a.sourceNumber - b.sourceNumber,
      ),
    [bank],
  );
  const shown = useMemo(() => sorted.filter((q) => matches(q, filters, progress)), [sorted, filters, progress]);
  const facet = (g: Group, v: string) =>
    bank.filter((q) => matches(q, filters, progress, g) && valueMatches(g, v, q, progress)).length;

  const update = (g: Group, v: string) => {
    const list = filters[g] as string[];
    const next = { ...filters, [g]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] } as Filters;
    // Dropping a domain also drops its skills.
    if (g === "domain" && list.includes(v)) next.skill = next.skill.filter((s) => !SKILLS[v as Domain].includes(s));
    writeFilters(next);
    setLimit(PAGE);
    setOpen(null);
  };
  const clear = () => {
    writeFilters({ status: [], domain: [], skill: [], difficulty: [], type: [], source: [] });
    setLimit(PAGE);
  };
  const activeCount = GROUPS.reduce((n, g) => n + filters[g].length, 0);
  const anyFilter = activeCount > 0;

  const domains = DOMAINS.filter((d) => bank.some((q) => q.domain === d));
  const skillDomains = filters.domain.length ? domains.filter((d) => filters.domain.includes(d)) : domains;
  const difficulties = DIFFICULTIES.filter((d) => bank.some((q) => q.difficulty === d));
  const sources = [...new Set(bank.map((q) => q.source))];

  const pool = mode === "timed" ? shown.filter((q) => !q.flag) : shown;
  const n = Math.max(1, Math.min(count || 1, pool.length));
  const title = setTitle(filters);

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

  return (
    <div className="min-h-dvh bg-[#f6f7fb]">
      <AppHeader active="bank" />
      {notice}
      <div className="mx-auto max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="mb-4 lg:mb-0">
          {/* On small screens the filters fold away behind a button. */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="flex w-full items-center rounded-2xl border border-bb-line bg-white px-5 py-3 font-bold lg:hidden"
          >
            <span className="flex-1 text-left">
              Filters{anyFilter && <span className="font-semibold text-bb-blue"> · {activeCount} on</span>}
            </span>
            <span className="text-sm font-semibold text-bb-muted">{filtersOpen ? "Hide" : "Show"}</span>
          </button>
          <div
            className={`mt-3 rounded-2xl border border-bb-line bg-white p-5 lg:sticky lg:top-4 lg:mt-0 lg:block lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto ${
              filtersOpen ? "" : "hidden"
            }`}
          >
            <div className="mb-4 flex items-center">
              <h2 className="flex-1 font-bold">Filters</h2>
              {anyFilter && (
                <button onClick={clear} className="text-sm font-semibold text-bb-blue hover:underline">
                  Clear all
                </button>
              )}
            </div>
            <FilterSection title="Status">
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((o) => (
                  <Chip
                    key={o.value}
                    label={o.label}
                    on={filters.status.includes(o.value)}
                    count={facet("status", o.value)}
                    onClick={() => update("status", o.value)}
                  />
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Domain">
              <div className="flex flex-wrap gap-1.5">
                {domains.map((d) => (
                  <Chip
                    key={d}
                    label={d}
                    on={filters.domain.includes(d)}
                    count={facet("domain", d)}
                    onClick={() => update("domain", d)}
                  />
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Skill">
              <div className="space-y-3">
                {skillDomains.map((d) => (
                  <div key={d}>
                    {skillDomains.length > 1 && <p className="mb-1 text-xs font-semibold text-bb-muted">{d}</p>}
                    <ul className="space-y-0.5">
                      {SKILLS[d]
                        .filter((s) => bank.some((q) => q.skill === s))
                        .map((s) => {
                          const on = filters.skill.includes(s);
                          const c = facet("skill", s);
                          return (
                            <li key={s}>
                              <label
                                className={`flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-[13px] leading-snug hover:bg-bb-bar ${
                                  !c && !on ? "text-[#a5a5a5]" : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => update("skill", s)}
                                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--bb-blue)]"
                                />
                                <span className="flex-1">{s}</span>
                                <span className="text-bb-muted">{c}</span>
                              </label>
                            </li>
                          );
                        })}
                    </ul>
                  </div>
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Difficulty">
              <div className="flex flex-wrap gap-1.5">
                {difficulties.map((d) => (
                  <Chip
                    key={d}
                    label={d}
                    on={filters.difficulty.includes(d)}
                    count={facet("difficulty", d)}
                    onClick={() => update("difficulty", d)}
                  />
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Type">
              <div className="flex flex-wrap gap-1.5">
                {(["mcq", "spr"] as const).map((t) => (
                  <Chip
                    key={t}
                    label={TYPE_LABEL[t]}
                    on={filters.type.includes(t)}
                    count={facet("type", t)}
                    onClick={() => update("type", t)}
                  />
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Source">
              <div className="flex flex-wrap gap-1.5">
                {sources.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    on={filters.source.includes(s)}
                    count={facet("source", s)}
                    onClick={() => update("source", s)}
                  />
                ))}
              </div>
            </FilterSection>
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-bb-line bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="mr-auto">
                <p className="text-2xl font-extrabold leading-none">
                  {shown.length}
                  <span className="ml-1.5 text-base font-semibold text-bb-muted">
                    {shown.length === 1 ? "question" : "questions"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-bb-muted">{title}</p>
              </div>
              <div className="flex rounded-full border border-bb-line p-0.5 text-sm font-semibold" role="radiogroup">
                {(["practice", "timed"] as const).map((m) => (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className={`rounded-full px-3.5 py-1.5 ${mode === m ? "bg-bb-ink text-white" : "hover:bg-bb-bar"}`}
                  >
                    {m === "practice" ? "Practice" : "Timed"}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                Questions
                <input
                  type="number"
                  min={1}
                  max={pool.length || 1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-16 rounded-md border border-bb-line px-2 py-1.5"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                Order
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value as "random" | "book")}
                  className="rounded-md border border-bb-line bg-white px-2 py-1.5"
                >
                  <option value="random">Random</option>
                  <option value="book">Book order</option>
                </select>
              </label>
              <button className="bb-btn bb-btn-primary" disabled={!pool.length} onClick={startSet}>
                {mode === "timed" ? `Start timed set · ${n}` : `Start practice · ${n}`}
              </button>
            </div>
            <p className="mt-3 text-sm text-bb-muted">
              {mode === "practice"
                ? "Check each answer as you go and see the explanation right away."
                : `${timedSeconds(n) / 60} minutes, no feedback until you submit, like a real module.`}
              {mode === "timed" && pool.length < shown.length && ` Flagged questions are left out.`}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-bb-line bg-white">
            {shown.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-semibold">No questions match these filters.</p>
                <button onClick={clear} className="mt-2 text-sm font-semibold text-bb-blue hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <ul>
                {shown.slice(0, limit).map((q) => {
                  const p = progress[q.id];
                  const isOpen = open === q.id;
                  return (
                    <li key={q.id} className="border-t border-bb-bar first:border-0">
                      <button
                        onClick={() => setOpen(isOpen ? null : q.id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-start gap-4 px-4 py-3.5 text-left hover:bg-[#f7f8fc] sm:px-5"
                      >
                        <span className="mt-0.5 grid h-7 min-w-7 place-items-center rounded-sm bg-bb-ink px-1.5 text-sm font-bold text-white">
                          {q.sourceNumber}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 truncate text-xs font-semibold text-bb-muted">
                            {q.domain} · {q.skill}
                          </p>
                          <Snippet stem={q.stem} />
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pt-0.5">
                          <span className="hidden rounded-full bg-bb-bar px-2 py-0.5 text-xs font-semibold sm:inline">
                            {q.type === "mcq" ? "MC" : "Grid-in"}
                          </span>
                          <span className="hidden rounded-full bg-bb-bar px-2 py-0.5 text-xs font-semibold sm:inline">
                            {q.difficulty}
                          </span>
                          {p?.last.marked && <BookmarkIcon filled width={18} height={18} className="text-bb-red" />}
                          <StatusIcon p={p} />
                        </div>
                      </button>
                      {isOpen && (
                        <Detail q={q} p={p} onPractice={() => start([q.id], "practice", `Question ${q.sourceNumber}`)} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {shown.length > limit && (
              <button
                onClick={() => setLimit((l) => l + PAGE)}
                className="w-full border-t border-bb-line py-3 text-sm font-semibold text-bb-blue hover:bg-[#f7f8fc]"
              >
                Show more ({shown.length - limit} left)
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
