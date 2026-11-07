"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ChartPie,
  Check,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  Download,
  Gauge,
  History,
  Hourglass,
  House,
  LayoutGrid,
  ListChecks,
  Search,
  Sigma,
  Snail,
  Target,
  Timer,
  Triangle,
  Variable,
  X,
  type LucideIcon,
} from "lucide-react";
import GlassWorkspace, { GlassChart, GlassSegment, type GlassSettings, type GlassView } from "../ui/adjustable-glass-dashboard";
import { AppHeader, NAV, PAGE } from "../AppHeader";
import { formatClock } from "../bluebook/TopBar";
import { useHydrated } from "../LocalDate";
import { mergeSessions, type SessionSummary } from "@/lib/history";
import { listFinished, type Session } from "@/lib/session";
import { computeStats, MIN_TO_RANK, PACE_MS, type AttemptRow, type Group, type Period, type QMeta } from "@/lib/stats";
import type { Domain, Question } from "@/lib/types";

/** The dashboard's views. /stats opens on Overview, /history on History. */
export type StatsTab = "overview" | "history" | "sections" | "reports";

const PERIODS = [
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["all", "All time"],
] as const satisfies readonly (readonly [Period, string])[];
const PERIOD_NAME: Record<Period, string> = { "7d": "the last 7 days", "30d": "the last 30 days", all: "all time" };

type Metric = "accuracy" | "score";
const METRICS = [
  ["accuracy", "Accuracy"],
  ["score", "Score"],
] as const satisfies readonly (readonly [Metric, string])[];

type Kind = SessionSummary["kind"] | "all";
const KIND: Record<SessionSummary["kind"], { label: string; plural: string; icon: LucideIcon }> = {
  exam: { label: "Full exam", plural: "Full exams", icon: Timer },
  timed: { label: "Timed set", plural: "Timed sets", icon: Hourglass },
  practice: { label: "Practice", plural: "Practice", icon: BookOpen },
};

/** Sections in the order the Practice page shows them, with short names. */
const SECTIONS: { domain: Domain; label: string; icon: LucideIcon }[] = [
  { domain: "Algebra", label: "Algebra", icon: Variable },
  { domain: "Advanced Math", label: "Advanced Math", icon: Sigma },
  { domain: "Geometry and Trigonometry", label: "Geometry", icon: Triangle },
  { domain: "Problem-Solving and Data Analysis", label: "Problem Solving", icon: ChartPie },
];
const sectionIcon = (domain: Domain) => SECTIONS.find((x) => x.domain === domain)?.icon ?? LayoutGrid;

/** The standard look of the glass; the viewer can change it and it's remembered in this browser. */
const BASE_GLASS: GlassSettings = { blur: 22, opacity: 0.42, saturation: 1.3, tint: "#ffffff", edge: 0.6 };
const GLASS_KEY = "mather:glass";

function readGlass(): Partial<GlassSettings> | undefined {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(GLASS_KEY) ?? "null");
    return saved && typeof saved === "object" ? (saved as Partial<GlassSettings>) : undefined;
  } catch {
    return undefined;
  }
}
function saveGlass(settings: GlassSettings) {
  try {
    localStorage.setItem(GLASS_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be off (private windows); the look just isn't remembered.
  }
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const clock = (ms: number) => formatClock(ms / 1000);
const shortDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const count = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
const stamp = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const practiceLink = (skill: string) => {
  const p = new URLSearchParams();
  p.append("skill", skill);
  p.append("status", "incorrect");
  p.append("status", "unanswered");
  return `/bank?${p}`;
};

/** A CSV cell. Text that a spreadsheet would run as a formula is defused, as the original component did. */
const cell = (v: string | number) =>
  typeof v === "number" ? String(v) : `"${(/^\s*[=+@-]/.test(v) ? "'" : "") + v.replace(/"/g, '""')}"`;

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Empty({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="gw-empty">
      <Icon size={23} aria-hidden="true" />
      <h3>{title}</h3>
      {children}
    </div>
  );
}

/** One finished set or exam; opens its results. */
function SessionRow({ s }: { s: SessionSummary }) {
  const k = KIND[s.kind];
  const sub = [
    s.title.startsWith(k.label) ? null : k.label,
    shortDate(s.finishedAt),
    s.timeMs > 0 ? `${clock(s.timeMs)} spent` : null,
    s.route ? `${s.route} Module 2` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link href={`/results?id=${s.id}`} className="gw-transaction">
      <span className={`gw-transaction-icon ${s.kind === "exam" ? "is-income" : ""}`}>
        <k.icon size={17} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <div className="gw-transaction-name">
        <strong>{s.title}</strong>
        <span>{sub}</span>
      </div>
      <span className="gw-transaction-status">
        {s.estimate ? `≈ ${s.estimate.score}` : s.total ? pct(s.correct / s.total) : ""}
      </span>
      <strong>
        {s.correct}/{s.total}
      </strong>
    </Link>
  );
}

/** Accuracy as a bar, in the style of the original's savings goals. */
function Meter({
  icon: Icon,
  name,
  href,
  value,
  valueText,
  left,
  right,
}: {
  icon: LucideIcon;
  name: string;
  href?: string;
  value: number;
  valueText: string;
  left: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="gw-goal">
      <div className="gw-goal-top">
        <span className="gw-goal-icon">
          <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <strong>{href ? <Link href={href}>{name}</Link> : name}</strong>
        <span>{valueText}</span>
      </div>
      <div
        className="gw-goal-track"
        role="progressbar"
        aria-label={`${name} accuracy`}
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <i style={{ width: `${value * 100}%` }} />
      </div>
      <p>
        <span>{left}</span>
        {right && <span>{right}</span>}
      </p>
    </div>
  );
}

const correctOf = (g: Group) => (
  <>
    <strong>{g.correct}</strong> of {g.n} correct
  </>
);

function Tile({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon: LucideIcon }) {
  return (
    <section className="gw-panel">
      <div className="gw-panel-title">
        <span>{label}</span>
        <Icon size={17} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      <span>{sub}</span>
    </section>
  );
}

export function StatsView({
  view: initialView,
  bank,
  rows,
  sessions,
  now,
  notice,
}: {
  view: StatsTab;
  bank: Question[];
  rows: AttemptRow[];
  sessions: SessionSummary[] | null;
  now: number;
  notice?: ReactNode;
}) {
  const hydrated = useHydrated();
  const [view, setView] = useState<StatsTab>(initialView);
  const [period, setPeriod] = useState<Period>("all");
  const [metric, setMetric] = useState<Metric>("accuracy");
  const [kind, setKind] = useState<Kind>("all");
  const [filter, setFilter] = useState("");
  const [local, setLocal] = useState<Session[]>([]);
  // Only read in the browser: the dashboard itself renders after hydration.
  const [savedGlass] = useState(readGlass);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage after mount
    setLocal(listFinished());
  }, []);

  const byId = useMemo(() => new Map(bank.map((q) => [q.id, q])), [bank]);
  const meta = useMemo<Record<string, QMeta>>(
    () =>
      Object.fromEntries(
        bank.map((q) => [q.id, { domain: q.domain, skill: q.skill, difficulty: q.difficulty, number: q.sourceNumber, source: q.source }]),
      ),
    [bank],
  );
  // Sessions from the database plus finished ones only this browser has, newest first.
  const all = useMemo(() => mergeSessions(sessions, local, byId), [sessions, local, byId]);
  const s = useMemo(
    () => computeStats(rows, meta, all, { period, now, bankSize: bank.length }),
    [rows, meta, all, period, now, bank.length],
  );

  // Days and weeks are local to the viewer, so everything renders after hydration.
  if (!hydrated) {
    return (
      <div className="min-h-dvh">
        <AppHeader active="stats" />
        <p className={`${PAGE} py-6 text-bb-muted sm:py-10`}>Loading stats…</p>
      </div>
    );
  }

  const per = s.bucket;
  const periodName = PERIOD_NAME[period];
  /** "yet" for all time, "in the last 7 days" otherwise. */
  const sofar = period === "all" ? "yet" : `in ${periodName}`;
  const periodShort = PERIODS.find((p) => p[0] === period)![1];
  const periodControl = <GlassSegment value={period} options={PERIODS} onChange={setPeriod} label="Time period" />;
  const missed = s.answered - s.correct;
  const labels = s.buckets.map((b) => shortDate(b.start));
  const domainGroup = new Map(s.byDomain.map((g) => [g.key, g]));

  const exams = all.filter((x) => x.kind === "exam" && x.estimate);
  const latest = exams[0];
  const previous = exams[1];
  const delta = latest?.estimate && previous?.estimate ? latest.estimate.score - previous.estimate.score : null;

  /* ---------- Overview ---------- */
  const countTop = Math.max(2, Math.ceil(Math.max(0, ...s.buckets.flatMap((b) => [b.correct, b.answered - b.correct])) / 2) * 2);
  const overview = (
    <>
      <div className="gw-overview-grid">
        <section className="gw-panel gw-balance gw-reveal">
          <div className="gw-panel-title">
            <span>Estimated SAT Math score</span>
            <Gauge size={17} aria-hidden="true" />
          </div>
          <strong className="gw-balance-value">{latest?.estimate?.score ?? "–"}</strong>
          <p className="gw-balance-meta">
            {latest?.estimate ? (
              <>
                {delta !== null && (
                  <>
                    <span className={delta > 0 ? "gw-positive" : delta < 0 ? "gw-negative" : "gw-flat"}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                    since the exam before ·{" "}
                  </>
                )}
                likely {latest.estimate.low}–{latest.estimate.high}
              </>
            ) : (
              "Out of 800. A full exam gives you one."
            )}
          </p>
          <div className="gw-account">
            <span className="gw-account-icon">
              <ClipboardCheck size={19} aria-hidden="true" />
            </span>
            <div>
              <strong>{latest ? "Latest full exam" : "No full exam yet"}</strong>
              <span>{latest ? `${shortDate(latest.finishedAt)} · ${latest.correct}/${latest.total} correct` : "44 questions · 70 minutes"}</span>
            </div>
            <Link
              href={latest ? `/results?id=${latest.id}` : "/"}
              aria-label={latest ? "Open the latest exam's results" : "Start a full exam on the home page"}
            >
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="gw-panel gw-reveal">
          <div className="gw-panel-title">
            <h2>Answers</h2>
            <span>
              per {per}, {periodName}
            </span>
          </div>
          <div className="gw-chart-summary">
            <div>
              <span>
                <i />
                Correct
              </span>
              <strong>{s.correct.toLocaleString()}</strong>
            </div>
            <div>
              <span>
                <i />
                Missed
              </span>
              <strong>{missed.toLocaleString()}</strong>
            </div>
            <div>
              <span>Accuracy</span>
              <strong>{s.answered ? pct(s.accuracy) : "–"}</strong>
            </div>
          </div>
          {s.answered ? (
            <GlassChart
              labels={labels}
              series={[
                { name: "Correct", values: s.buckets.map((b) => b.correct) },
                { name: "Missed", values: s.buckets.map((b) => b.answered - b.correct), muted: true },
              ]}
              max={countTop}
              format={(v) => String(Math.round(v))}
              ariaLabel={`Correct and missed answers per ${per}, ${periodName}: ${s.correct} correct, ${missed} missed.`}
            />
          ) : (
            <Empty icon={ChartNoAxesCombined} title={`No answers ${sofar}`}>
              <p>Correct and missed answers show up here per {per}.</p>
              <Link href="/bank">Practice</Link>
            </Empty>
          )}
          {s.truncated && <p className="gw-chart-footnote">Showing the last 26 weeks.</p>}
        </section>
      </div>
      <div className="gw-lower-grid">
        <section className="gw-panel gw-reveal">
          <div className="gw-panel-title">
            <h2>Recent sessions</h2>
            {all.length > 0 && (
              <button className="gw-text-button" type="button" onClick={() => setView("history")}>
                View all
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>
          {all.length ? (
            <div className="gw-transactions">
              {all.slice(0, 4).map((x) => (
                <SessionRow key={x.id} s={x} />
              ))}
            </div>
          ) : (
            <Empty icon={History} title="Nothing yet">
              <p>Finished sets and exams show up here.</p>
              <Link href="/bank">Start practicing</Link>
            </Empty>
          )}
        </section>
        <section className="gw-panel gw-reveal">
          <div className="gw-panel-title">
            <h2>Weakest skills</h2>
            <span className="gw-small-label">{periodShort}</span>
          </div>
          {s.weakest.length ? (
            <div className="gw-goals">
              {s.weakest.slice(0, 4).map((g) => (
                <Meter
                  key={g.key}
                  icon={sectionIcon(g.domain)}
                  name={g.key}
                  value={g.accuracy}
                  valueText={pct(g.accuracy)}
                  left={correctOf(g)}
                  right={
                    <Link href={practiceLink(g.key)} aria-label={`Practice ${g.key}`}>
                      Practice
                    </Link>
                  }
                />
              ))}
            </div>
          ) : (
            <p className="gw-empty">Answer at least {MIN_TO_RANK} questions in a skill to rank it.</p>
          )}
        </section>
      </div>
    </>
  );

  /* ---------- History ---------- */
  const q = filter.trim().toLowerCase();
  const shown = all.filter(
    (x) =>
      (kind === "all" || x.kind === kind) &&
      (!q || `${x.title} ${KIND[x.kind].label} ${shortDate(x.finishedAt)}`.toLowerCase().includes(q)),
  );
  const kindOptions = (["all", "exam", "timed", "practice"] as const).map(
    (k) =>
      [
        k,
        <>
          {k === "all" ? "All" : KIND[k].plural}
          <span className="gw-count">{k === "all" ? all.length : all.filter((x) => x.kind === k).length}</span>
        </>,
      ] as const,
  );
  const history = (
    <section className="gw-panel gw-reveal">
      <div className="gw-panel-title">
        <h2>
          Sessions <span className="gw-count">{all.length}</span>
        </h2>
        <label className="gw-search">
          <Search size={15} aria-hidden="true" />
          <input aria-label="Search sessions" placeholder="Search sessions" value={filter} onChange={(e) => setFilter(e.target.value)} />
          {filter && (
            <button type="button" aria-label="Clear search" onClick={() => setFilter("")}>
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </label>
      </div>
      <div className="gw-filter">
        <GlassSegment value={kind} options={kindOptions} onChange={setKind} label="Show" />
      </div>
      {shown.length ? (
        <div className="gw-transactions">
          {shown.map((x) => (
            <SessionRow key={x.id} s={x} />
          ))}
        </div>
      ) : (
        <Empty icon={Search} title={q ? "No matching sessions" : "Nothing here yet"}>
          <p>{q ? "Try another name or date." : "Finished sets and exams show up here."}</p>
          {q && (
            <button type="button" onClick={() => setFilter("")}>
              Clear search
            </button>
          )}
        </Empty>
      )}
    </section>
  );
  const exportSessions = () => {
    if (!shown.length) return "Nothing to export.";
    downloadCsv("mather-sessions.csv", [
      ["Session", "Type", "Finished", "Correct", "Total", "Accuracy", "Time", "Score estimate", "Module 2"],
      ...shown.map((x) => [
        x.title,
        KIND[x.kind].label,
        stamp(x.finishedAt),
        x.correct,
        x.total,
        x.total ? pct(x.correct / x.total) : "",
        x.timeMs ? clock(x.timeMs) : "",
        x.estimate?.score ?? "",
        x.route ?? "",
      ]),
    ]);
    return `Exported ${count(shown.length, "session")}.`;
  };

  /* ---------- Sections ---------- */
  const sections = (
    <>
      <div className="gw-savings-intro gw-reveal">
        <span className="gw-savings-orb">
          <Target size={28} strokeWidth={1.3} aria-hidden="true" />
        </span>
        <div>
          <p>Accuracy, {periodName}</p>
          <strong>{s.answered ? pct(s.accuracy) : "–"}</strong>
        </div>
        <span>
          {count(s.answered, "answer")} on {count(s.daysPracticed, "day")}
          <br />
          {s.notTried} of {bank.length} questions not tried yet
        </span>
      </div>
      <section className="gw-panel gw-reveal">
        <div className="gw-panel-title">
          <h2>By section</h2>
          <span>Open one to see its questions</span>
        </div>
        <div className="gw-goals">
          {SECTIONS.map(({ domain, label, icon }) => {
            const g = domainGroup.get(domain);
            return (
              <Meter
                key={domain}
                icon={icon}
                name={label}
                href={`/bank?domain=${encodeURIComponent(domain)}`}
                value={g?.accuracy ?? 0}
                valueText={g ? pct(g.accuracy) : "–"}
                left={g ? correctOf(g) : "Not tried yet"}
                right={g ? `${clock(g.avgTimeMs)} each` : undefined}
              />
            );
          })}
        </div>
      </section>
      <section className="gw-panel gw-reveal">
        <div className="gw-panel-title">
          <h2>Every skill</h2>
          <span>{count(s.bySkill.length, "skill")} practiced</span>
        </div>
        {s.bySkill.length ? (
          <div className="gw-goals">
            {s.bySkill.map((g) => (
              <Meter
                key={g.key}
                icon={sectionIcon(g.domain)}
                name={g.key}
                href={practiceLink(g.key)}
                value={g.accuracy}
                valueText={pct(g.accuracy)}
                left={correctOf(g)}
                right={
                  <>
                    {clock(g.avgTimeMs)} each
                    {g.avgTimeMs > PACE_MS && <span className="gw-slow"> · slow</span>}
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <p className="gw-empty">No skills practiced {sofar}.</p>
        )}
      </section>
      <section className="gw-savings-note gw-reveal">
        <Check size={18} aria-hidden="true" />
        <p>Open a skill to practice the questions you missed or haven&apos;t tried. &ldquo;Slow&rdquo; means over the SAT pace of {clock(PACE_MS)} a question.</p>
      </section>
    </>
  );

  /* ---------- Reports ---------- */
  const misses = SECTIONS.map(({ domain, label, icon }) => {
    const g = domainGroup.get(domain);
    return { domain, label, icon, missed: g ? g.n - g.correct : 0 };
  })
    .filter((x) => x.missed > 0)
    .sort((a, b) => b.missed - a.missed);
  const reports = (
    <>
      <div className="gw-report-stats gw-reveal">
        <Tile label="Answered" value={s.answered.toLocaleString()} sub={periodShort} icon={ListChecks} />
        <Tile
          label="Accuracy"
          value={s.answered ? pct(s.accuracy) : "–"}
          sub={`${s.correct.toLocaleString()} correct, ${missed.toLocaleString()} missed`}
          icon={Target}
        />
        <Tile label="Per question" value={s.answered ? clock(s.avgTimeMs) : "–"} sub={`SAT pace ${clock(PACE_MS)}`} icon={Timer} />
      </div>
      <div className="gw-reports-grid">
        <section className="gw-panel gw-reveal">
          <div className="gw-panel-title">
            <h2>{metric === "accuracy" ? "Accuracy over time" : "Score estimate by exam"}</h2>
            <GlassSegment value={metric} options={METRICS} onChange={setMetric} label="Chart" />
          </div>
          <div className="gw-chart-legend">
            <span>
              <i />
              {metric === "accuracy" ? `Accuracy per ${per}, ${periodName}` : `Each full exam, ${periodName}`}
            </span>
          </div>
          {metric === "accuracy" ? (
            s.answered ? (
              <GlassChart
                labels={labels}
                series={[{ name: "Accuracy", values: s.buckets.map((b) => (b.answered ? Math.round((b.correct / b.answered) * 100) : null)) }]}
                max={100}
                format={(v) => `${Math.round(v)}%`}
                ariaLabel={`Accuracy per ${per}, ${periodName}: ${pct(s.accuracy)} overall.`}
              />
            ) : (
              <Empty icon={ChartNoAxesCombined} title={`No answers ${sofar}`} />
            )
          ) : s.exams.length ? (
            <GlassChart
              labels={s.exams.map((e) => shortDate(e.finishedAt))}
              series={[{ name: "Estimate", values: s.exams.map((e) => e.estimate?.score ?? null) }]}
              min={200}
              max={800}
              format={(v) => String(Math.round(v))}
              ariaLabel={`Estimated score for each full exam, ${periodName}.`}
            />
          ) : (
            <Empty icon={Gauge} title={`No full exams ${sofar}`}>
              <Link href="/">Take a full exam</Link>
            </Empty>
          )}
          <p className="gw-chart-footnote">
            {metric === "score"
              ? s.exams.map((e) => `${shortDate(e.finishedAt)}: ${e.estimate?.score ?? "–"} (${e.correct}/${e.total})`).join(" · ")
              : s.truncated
                ? "Showing the last 26 weeks."
                : `A ${per} with no answers is left blank.`}
          </p>
        </section>
        <section className="gw-panel gw-reveal">
          <div className="gw-panel-title">
            <h2>Where you miss</h2>
            <span>{count(missed, "miss", "misses")}</span>
          </div>
          {misses.length ? (
            <div className="gw-category-list">
              {misses.map((m) => (
                <div key={m.domain}>
                  <div>
                    <m.icon aria-hidden="true" />
                    <Link href={`/bank?domain=${encodeURIComponent(m.domain)}&status=incorrect`}>{m.label}</Link>
                    <strong>{m.missed}</strong>
                  </div>
                  <span className="gw-category-track">
                    <i style={{ width: `${(m.missed / missed) * 100}%` }} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="gw-empty">No misses {sofar}.</p>
          )}
        </section>
      </div>
      <div className="gw-report-stats gw-reveal">
        <Tile
          label="Days practiced"
          value={String(s.daysPracticed)}
          sub={s.streak ? `${s.streak}-day streak` : "No current streak"}
          icon={CalendarDays}
        />
        <Tile label="Not tried yet" value={String(s.notTried)} sub={`of ${bank.length} in the bank`} icon={LayoutGrid} />
        <Tile label="Slower than pace" value={String(s.overPace)} sub={`answers over ${clock(PACE_MS)}`} icon={Snail} />
      </div>
      <div className="gw-lower-grid">
        <section className="gw-panel gw-reveal">
          <div className="gw-panel-title">
            <h2>Practice and tests</h2>
            <span>Tests are full exams and timed sets</span>
          </div>
          {s.byMode.length ? (
            <div className="gw-goals">
              {s.byMode.map((g) => (
                <Meter
                  key={g.key}
                  icon={g.key === "Tests" ? Timer : BookOpen}
                  name={g.key}
                  value={g.accuracy}
                  valueText={pct(g.accuracy)}
                  left={correctOf(g)}
                  right={`${clock(g.avgTimeMs)} each`}
                />
              ))}
            </div>
          ) : (
            <p className="gw-empty">Nothing {sofar}.</p>
          )}
          {s.byDifficulty.length > 1 && (
            <>
              <p className="gw-subhead">By difficulty</p>
              <div className="gw-goals">
                {s.byDifficulty.map((g) => (
                  <Meter
                    key={g.key}
                    icon={Gauge}
                    name={g.key}
                    value={g.accuracy}
                    valueText={pct(g.accuracy)}
                    left={correctOf(g)}
                    right={`${clock(g.avgTimeMs)} each`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
        <section className="gw-panel gw-reveal">
          <div className="gw-panel-title">
            <h2>Slowest questions</h2>
            <span>Opens the set it was in</span>
          </div>
          {s.slowest.length ? (
            <div className="gw-transactions">
              {s.slowest.map((a) => {
                const m = meta[a.questionId];
                return (
                  <Link key={`${a.sessionId}:${a.questionId}`} href={`/results?id=${a.sessionId}`} className="gw-transaction">
                    <span className={`gw-transaction-icon ${a.correct ? "is-right" : "is-wrong"}`}>
                      {a.correct ? <CircleCheck size={17} aria-label="Correct" /> : <CircleX size={17} aria-label="Missed" />}
                    </span>
                    <div className="gw-transaction-name">
                      <strong>
                        #{m.number} · {m.skill}
                      </strong>
                      <span>
                        {a.correct ? "Correct" : "Missed"} · {shortDate(a.at)}
                      </span>
                    </div>
                    <strong>{clock(a.timeMs)}</strong>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="gw-empty">Nothing yet.</p>
          )}
        </section>
      </div>
    </>
  );

  const views: GlassView[] = [
    { id: "overview", label: "Overview", icon: House, title: "Overview", eyebrow: "SAT Math progress", aside: periodControl, content: overview },
    {
      id: "history",
      label: "History",
      icon: History,
      title: "History",
      eyebrow: "Every finished set and exam",
      action: { label: "Export CSV", icon: Download, run: exportSessions },
      content: history,
    },
    { id: "sections", label: "Sections", icon: LayoutGrid, title: "Sections & skills", eyebrow: "Accuracy by part of the test", aside: periodControl, content: sections },
    { id: "reports", label: "Reports", icon: ChartNoAxesCombined, title: "Reports", eyebrow: "Trends and details", aside: periodControl, content: reports },
  ];

  return (
    <GlassWorkspace
      className="bb-glass"
      brand="mather"
      links={NAV.map((n) => ({ href: n.href, label: n.label, current: n.key === "stats" }))}
      views={views}
      view={view}
      onViewChange={(id) => setView(id as StatsTab)}
      banner={notice}
      footerNote="Score estimates come from your latest full exam and typical Bluebook score ranges. Book questions are often harder than the real test."
      glass={BASE_GLASS}
      initialGlass={savedGlass}
      onGlassChange={saveGlass}
    />
  );
}
