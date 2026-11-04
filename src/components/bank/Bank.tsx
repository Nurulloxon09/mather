"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader, PAGE as WIDTH } from "../AppHeader";
import { BookmarkIcon, CheckCircle, XCircle } from "../bluebook/icons";
import { formatClock } from "../bluebook/TopBar";
import { LocalDate } from "../LocalDate";
import { Rich, RichInline } from "../Rich";
import { Segmented } from "../Segmented";
import { hasStatus, type ProgressMap, type QuestionProgress, type Status } from "@/lib/attempts";
import { formatRanges, inRanges, parseNumberRanges } from "@/lib/numbers";
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
    case "num":
      return inRanges(q.sourceNumber, parseNumberRanges(v) ?? []);
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
  if (f.num.length) parts.push(`#${f.num[0]}`);
  return parts.join(" · ") || "Mixed Math";
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
        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
          picked.length ? "bg-bb-ink text-bb-bg" : "bg-bb-subtle hover:bg-bb-bar"
        }`}
      >
        <span className="max-w-[14rem] truncate">
          {picked.length === 1 ? picked[0].label : picked.length ? `${label} · ${picked.length}` : label}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className={`transition ${open ? "rotate-180" : ""}`}>
          <path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-bb-hair bg-bb-surface p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:right-auto sm:w-80">
          {options.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm leading-snug hover:bg-bb-subtle ${
                o.indent ? "pl-8" : ""
              } ${!o.count && !o.on ? "text-bb-faint" : ""}`}
            >
              <input
                type="checkbox"
                checked={o.on}
                onChange={() => onToggle(o.value)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--bb-ink)]"
              />
              <span className={`flex-1 ${o.strong ? "font-semibold" : ""}`}>{o.label}</span>
              <span className="tabular-nums text-bb-muted">{o.count}</span>
            </label>
          ))}
          {picked.length > 0 && (
            <button onClick={onClear} className="mt-1 w-full rounded-lg px-2.5 py-2 text-left text-sm text-bb-muted hover:bg-bb-subtle hover:text-bb-ink">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function StatusIcon({ p, size = 22 }: { p?: QuestionProgress; size?: number }) {
  if (!p)
    return (
      <span
        title="Not answered yet"
        className="inline-block rounded-full border-[1.5px] border-dashed border-bb-faint"
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
    <div className="mb-4 space-y-5 rounded-xl bg-bb-subtle px-4 py-5 sm:px-6">
      <p className="text-sm text-bb-muted">
        {q.domain} · {q.skill} · {TYPE_LABEL[q.type]} · {q.difficulty}
      </p>
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
        <button className="bb-btn bb-btn-primary !py-1.5 text-sm" onClick={onPractice}>
          Practice this question
        </button>
        <button className="text-sm font-semibold text-bb-muted hover:text-bb-ink" onClick={() => setReveal((v) => !v)}>
          {reveal ? "Hide answer" : "Show answer and explanation"}
        </button>
        <span className="ml-auto text-xs text-bb-muted">
          {q.source} #{q.sourceNumber}
          {q.page ? ` · page ${q.page}` : ""}
        </span>
      </div>

      {reveal && (
        <div className="space-y-3 border-l-2 border-bb-hair pl-4">
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

  const [open, setOpen] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [mode, setMode] = useState<"practice" | "timed">("practice");
  // Chosen numbers default to book order, including when they come from a link.
  const [order, setOrder] = useState<"random" | "book">(filters.num.length ? "book" : "random");
  const [count, setCount] = useState(10);
  const [numText, setNumText] = useState(filters.num[0] ?? "");

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
    writeFilters(NO_FILTERS);
    setNumText("");
    setLimit(PAGE);
  };
  // Question numbers: applied once the text reads as numbers; a chosen run is practiced whole, in book order.
  const numBad = parseNumberRanges(numText) === null;
  const setNumbers = (text: string) => {
    setNumText(text);
    const ranges = parseNumberRanges(text);
    if (ranges === null) return;
    writeFilters({ ...filters, num: ranges.length ? [formatRanges(ranges)] : [] });
    if (ranges.length && !filters.num.length) setOrder("book");
    setLimit(PAGE);
    setOpen(null);
  };
  const anyFilter = GROUPS.some((g) => filters[g].length > 0);

  const domains = DOMAINS.filter((d) => bank.some((q) => q.domain === d));
  const difficulties = DIFFICULTIES.filter((d) => bank.some((q) => q.difficulty === d));
  const sources = [...new Set(bank.map((q) => q.source))];

  const pool = mode === "timed" ? shown.filter((q) => !q.flag) : shown;
  const byNumber = filters.num.length > 0;
  const n = byNumber ? pool.length : Math.max(1, Math.min(count || 1, pool.length));
  const title = setTitle(filters);
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
    writeFilters(next);
    setLimit(PAGE);
  };
  // Topics: each domain, then its skills. Picking a skill narrows within its domain.
  const topicOptions: Option[] = domains.flatMap((d) => [
    { value: `d:${d}`, label: d, count: facet("domain", d), on: filters.domain.includes(d), strong: true },
    ...SKILLS[d]
      .filter((sk) => bank.some((q) => q.skill === sk))
      .map((sk) => ({ value: `s:${sk}`, label: sk, count: facet("skill", sk), on: filters.skill.includes(sk), indent: true })),
  ]);

  return (
    <div className="min-h-dvh">
      <AppHeader active="bank" />
      {notice}
      <main className={`${WIDTH} py-6 sm:py-10`}>
        {/* Filters: one row of menus. Groups with a single value (all "Hard", one book) are left out. */}
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
          <FilterMenu
            label="Type"
            options={menu("type", (["mcq", "spr"] as const).map((t) => ({ value: t, label: TYPE_LABEL[t] })))}
            onToggle={(v) => update("type", v)}
            onClear={() => clearGroup("type")}
          />
          {sources.length > 1 && (
            <FilterMenu
              label="Source"
              options={menu("source", sources.map((x) => ({ value: x, label: x })))}
              onToggle={(v) => update("source", v)}
              onClear={() => clearGroup("source")}
            />
          )}
          <label
            className={`flex items-center gap-1 rounded-full py-1.5 pl-3.5 pr-3 text-sm ${
              byNumber && !numBad ? "bg-bb-ink text-bb-bg" : "bg-bb-subtle"
            } ${numBad ? "ring-2 ring-bb-red" : ""}`}
          >
            <span className="font-semibold">#</span>
            <input
              value={numText}
              onChange={(e) => setNumbers(e.target.value)}
              placeholder="e.g. 10-20"
              aria-label="Question numbers"
              aria-invalid={numBad}
              className="w-24 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-bb-muted"
            />
          </label>
          {anyFilter && (
            <button onClick={clear} className="px-2 text-sm text-bb-muted hover:text-bb-ink">
              Clear all
            </button>
          )}
        </div>
        {numBad && <p className="mt-2 text-sm text-bb-red">Type question numbers like 10-20, 34, or 1-5, 12.</p>}

        {/* Start a set from whatever is shown. */}
        <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="mr-auto">
            <p className="text-3xl font-bold tabular-nums">
              {shown.length}
              <span className="ml-2 text-base font-normal text-bb-muted">{shown.length === 1 ? "question" : "questions"}</span>
            </p>
            <p className="mt-1 text-sm text-bb-muted">{title}</p>
            {byNumber && chapters.length > 1 && (
              <p className="mt-1 text-sm text-bb-muted">
                {chapters.join(" and ")} both have these numbers. Pick a Topic to choose one.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Segmented
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
              <label className="flex items-center gap-2 text-sm text-bb-muted">
                <input
                  type="number"
                  min={1}
                  max={pool.length || 1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  aria-label="Questions"
                  className="w-14 rounded-lg border border-bb-hair bg-bb-surface px-2 py-1.5 text-bb-ink"
                />
                questions
              </label>
            )}
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as "random" | "book")}
              aria-label="Order"
              className="rounded-lg border border-bb-hair bg-bb-surface px-2 py-1.5 text-sm"
            >
              <option value="random">Random order</option>
              <option value="book">Book order</option>
            </select>
            <button className="bb-btn bb-btn-primary" disabled={!pool.length} onClick={startSet}>
              {mode === "timed" ? `Start timed set · ${n}` : `Start practice · ${n}`}
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-bb-muted">
          {mode === "practice"
            ? "Check each answer as you go and see the explanation right away."
            : `${timedSeconds(n) / 60} minutes, no feedback until you submit, like a real module.`}
          {mode === "timed" && pool.length < shown.length && ` Flagged questions are left out.`}
        </p>

        <div className="mt-6">
          {shown.length === 0 ? (
            <div className="border-t border-bb-hair py-14 text-center">
              <p className="font-semibold">No questions match these filters.</p>
              <button onClick={clear} className="mt-2 text-sm text-bb-muted hover:text-bb-ink">
                Clear all filters
              </button>
            </div>
          ) : (
            <ul className="border-b border-bb-hair">
              {shown.slice(0, limit).map((q, i, list) => {
                const p = progress[q.id];
                const isOpen = open === q.id;
                const head = chapters.length > 1 && (i === 0 || chapter(list[i - 1]) !== chapter(q)) ? chapter(q) : null;
                return (
                  <Fragment key={q.id}>
                    {head && <li className="pb-2 pt-8 text-sm font-semibold text-bb-muted first:pt-0">{head}</li>}
                    <li className="border-t border-bb-hair">
                      <button
                        onClick={() => setOpen(isOpen ? null : q.id)}
                        aria-expanded={isOpen}
                        className="group flex w-full items-start gap-4 py-4 text-left"
                      >
                        <span className="w-8 shrink-0 pt-0.5 text-right font-semibold tabular-nums text-bb-muted group-hover:text-bb-ink">
                          {q.sourceNumber}
                        </span>
                        <div className="min-w-0 flex-1">
                          <Snippet stem={q.stem} />
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pt-0.5">
                          {p?.last.marked && <BookmarkIcon filled width={18} height={18} className="text-bb-red" />}
                          <StatusIcon p={p} />
                        </div>
                      </button>
                      {isOpen && (
                        <Detail q={q} p={p} onPractice={() => start([q.id], "practice", `Question ${q.sourceNumber}`)} />
                      )}
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          )}
          {shown.length > limit && (
            <button
              onClick={() => setLimit((l) => l + PAGE)}
              className="mt-2 w-full py-3 text-sm font-semibold text-bb-muted hover:text-bb-ink"
            >
              Show more ({shown.length - limit} left)
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
