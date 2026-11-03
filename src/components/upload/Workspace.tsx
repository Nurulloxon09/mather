"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { WIDE } from "../AppHeader";
import { DraftEditor } from "./DraftEditor";
import { PageViewer } from "./PageViewer";
import { api, ApiError } from "@/lib/client/api";
import { runExtraction, type Control, type RunnerUpdate } from "@/lib/client/extract";
import type { Question } from "@/lib/types";
import { FIGURE_RE, fileUrl, figureWidth, type Draft, type UploadState } from "@/lib/uploads";
import { questionProblems } from "@/lib/validate";

type Filter = "all" | "todo" | "issues" | "published" | "rejected";
const MODEL_KEY = "mather:model";

export function Workspace({
  initial,
  models,
  aiReady,
  autoStart,
  initialQuestion,
}: {
  initial: UploadState;
  models: { id: string; label: string }[];
  aiReady: boolean;
  autoStart: boolean;
  initialQuestion?: string;
}) {
  const [state, setState] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initialQuestion ?? initial.drafts[0]?.id ?? null);
  const selected = state.drafts.find((d) => d.id === selectedId) ?? null;
  const [form, setForm] = useState<Question | null>(selected?.question ?? null);
  const [section, setSection] = useState(selected?.meta.section ?? "");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const [viewPage, setViewPage] = useState<number>(selected?.question.page ?? initial.pages[0]?.page ?? 1);
  const [selecting, setSelecting] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [model, setModel] = useState(models[0]?.id ?? "");

  // Extraction runner state
  const ctl = useRef<Control>({ stopped: false });
  const [running, setRunning] = useState(false);
  const [runText, setRunText] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [waiting, setWaiting] = useState<{ seconds: number; reason: string } | null>(null);
  const [runIssue, setRunIssue] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<{ pages: number[]; reason: string }[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the last model picked in this browser
      if (saved && models.some((m) => m.id === saved)) setModel(saved);
    } catch {
      // storage blocked
    }
  }, [models]);

  const replaceDraft = useCallback((d: Draft) => {
    setState((s) => ({ ...s, drafts: s.drafts.map((x) => (x.id === d.id ? d : x)) }));
  }, []);

  const problemsById = useMemo(
    () => new Map(state.drafts.map((d) => [d.id, questionProblems(d.question)])),
    [state.drafts],
  );
  const formProblems = useMemo(() => (form ? questionProblems(form) : []), [form]);
  const pendingPages = state.pages.filter((p) => !p.extracted).length;
  const counts = {
    todo: state.drafts.filter((d) => d.status === "draft").length,
    published: state.drafts.filter((d) => d.status === "published").length,
    rejected: state.drafts.filter((d) => d.status === "rejected").length,
  };

  const needsWork = (d: Draft) =>
    (problemsById.get(d.id)?.length ?? 0) > 0 || !d.meta.complete || !!d.meta.keyConflict || d.meta.figures.length > 0;
  const listed = state.drafts.filter((d) =>
    filter === "all"
      ? true
      : filter === "todo"
        ? d.status === "draft"
        : filter === "issues"
          ? d.status === "draft" && needsWork(d)
          : d.status === filter,
  );
  const ready = state.drafts.filter((d) => d.status === "draft" && !needsWork(d));

  // ---------- Selecting, saving, publishing ----------

  const load = (d: Draft | null) => {
    setSelectedId(d?.id ?? null);
    setForm(d?.question ?? null);
    setSection(d?.meta.section ?? "");
    setDirty(false);
    setSelecting(false);
    if (d?.question.page) setViewPage(d.question.page);
  };
  // Read by the extraction callbacks, which outlive a single render.
  const selectedRef = useRef(selectedId);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    selectedRef.current = selectedId;
    dirtyRef.current = dirty;
  }, [selectedId, dirty]);

  const save = async (status?: Draft["status"]) => {
    if (!selected || !form) return null;
    setBusy(true);
    setMessage(null);
    try {
      const d = await api.updateQuestion(selected.id, {
        ...(dirty ? { question: form, section } : {}),
        ...(status ? { status } : {}),
      });
      replaceDraft(d);
      setForm(d.question);
      setDirty(false);
      if (status === "published") setMessage({ tone: "ok", text: `Question ${d.question.sourceNumber} is in the bank.` });
      return d;
    } catch (err) {
      const e = err as ApiError;
      setMessage({ tone: "error", text: [e.message, ...(e.details ?? [])].join(" · ") });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const open = async (d: Draft) => {
    if (d.id === selectedId) return;
    if (dirty && !(await save())) return;
    load(d);
  };

  const step = (dir: 1 | -1) => {
    const i = listed.findIndex((d) => d.id === selectedId);
    const next = listed[i + dir];
    if (next) void open(next);
  };

  const setStatus = async (status: Draft["status"]) => {
    const d = await save(status);
    // Move on to the next question still in draft after publishing or rejecting.
    if (d && status !== "draft") {
      const after = state.drafts.slice(state.drafts.findIndex((x) => x.id === d.id) + 1).find((x) => x.status === "draft");
      if (after) load(after);
    }
  };

  const publishReady = async () => {
    if (!ready.length || !confirm(`Publish ${ready.length} question${ready.length === 1 ? "" : "s"} that have no problems flagged?`)) return;
    setBusy(true);
    let ok = 0;
    for (const d of ready) {
      try {
        replaceDraft(await api.updateQuestion(d.id, { status: "published" }));
        ok++;
      } catch {
        // stays in draft; its problems show in the list
      }
    }
    setBusy(false);
    setMessage({ tone: "ok", text: `Published ${ok} question${ok === 1 ? "" : "s"}.` });
  };

  const askAi = async () => {
    if (!selected) return;
    setAiBusy(true);
    setMessage(null);
    try {
      const d = await api.solve(selected.id, model);
      // Keep any unsaved edits; only the AI suggestion is new.
      setState((s) => ({
        ...s,
        drafts: s.drafts.map((x) => (x.id === d.id ? { ...x, meta: { ...x.meta, ai: d.meta.ai } } : x)),
      }));
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    } finally {
      setAiBusy(false);
    }
  };

  const addQuestion = async () => {
    if (dirty && !(await save())) return;
    try {
      const d = await api.addQuestion(state.upload.id, viewPage);
      setState((s) => ({ ...s, drafts: [...s.drafts, d] }));
      load(d);
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    }
  };

  /** Crop the dragged rectangle and put it in the question: into the first [[FIGURE n]] slot, or at the end. */
  const applySelection = async (box: [number, number, number, number]) => {
    const page = state.pages.find((p) => p.page === viewPage);
    if (!page?.fileId || !form || !selected) return;
    setSelecting(false);
    try {
      const { cropImage } = await import("@/lib/client/pages");
      const crop = await cropImage(fileUrl(page.fileId), box);
      const up = await api.uploadFile(state.upload.id, crop.blob, "figure.png");
      const img = `![figure](${up.url}){w=${figureWidth(box)}}`;
      const fields = [form.stem, form.explanation, ...(form.choices ?? [])];
      const slot = fields.join("\n").match(new RegExp(FIGURE_RE.source, "i"))?.[0];
      let next: Question;
      if (slot) {
        const swap = (s: string) => s.replace(slot, img);
        next = { ...form, stem: swap(form.stem), explanation: swap(form.explanation), choices: form.choices?.map(swap) };
        const label = slot.replace(/[[\]]/g, "").trim().toUpperCase().replace(/\s+/g, " ");
        replaceDraft({ ...selected, meta: { ...selected.meta, figures: selected.meta.figures.filter((f) => f.label !== label) } });
      } else {
        next = { ...form, stem: `${form.stem.trimEnd()}\n\n${img}` };
      }
      setForm(next);
      setDirty(true);
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    }
  };

  // ---------- Extraction ----------

  const onUpdate = (u: RunnerUpdate) => {
    switch (u.type) {
      case "status":
        setRunText(u.text);
        break;
      case "progress":
        setProgress({ done: u.done, total: u.total });
        break;
      case "waiting":
        setWaiting(u.seconds ? { seconds: u.seconds, reason: u.reason } : null);
        break;
      case "state":
        setState((s) => {
          // Keep the question being edited as the user has it.
          const merged = u.state.drafts.map((d) => s.drafts.find((x) => x.id === d.id && x.updatedAt > d.updatedAt) ?? d);
          return { ...u.state, drafts: merged };
        });
        // Open the first question as soon as one exists.
        if (!selectedRef.current && u.state.drafts[0]) {
          selectedRef.current = u.state.drafts[0].id;
          load(u.state.drafts[0]);
        } else if (!dirtyRef.current) {
          // The open question can change underneath (answer key matched, figure cropped): show that,
          // unless there are edits in progress.
          const cur = u.state.drafts.find((d) => d.id === selectedRef.current);
          if (cur) {
            setForm(cur.question);
            setSection(cur.meta.section);
          }
        }
        break;
      case "skipped":
        setSkipped((xs) => [...xs, { pages: u.pages, reason: u.reason }]);
        break;
      case "stopped":
        setRunning(false);
        setRunIssue(u.reason === "Paused" ? null : u.reason);
        setRunText(u.reason === "Paused" ? "Paused" : "");
        break;
      case "done":
        setRunning(false);
        setRunText("All pages read. Check each question below, then publish it.");
        break;
    }
  };

  const start = (from: UploadState) => {
    ctl.current = { stopped: false };
    setRunning(true);
    setRunIssue(null);
    setRunText("Starting…");
    void runExtraction(from, model, ctl.current, onUpdate).catch((err) => {
      setRunning(false);
      setRunIssue((err as Error).message);
    });
  };

  const autoStarted = useRef(false);
  // Coming straight from the upload form (?start=1): begin reading right away, once.
  const startFromUpload = useEffectEvent(() => {
    if (autoStarted.current || !autoStart || !aiReady || !initial.pages.some((p) => !p.extracted)) return;
    autoStarted.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    start(initial);
  });
  useEffect(() => startFromUpload(), []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || running) e.preventDefault();
    };
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty) void save();
      }
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("keydown", keys);
    };
  });

  const page = state.pages.find((p) => p.page === viewPage);
  const pageIndex = state.pages.findIndex((p) => p.page === viewPage);
  const boxes = selected?.meta.figures.filter((f) => f.page === viewPage) ?? [];
  const u = state.upload;

  return (
    <div className={`${WIDE} pb-6 pt-2`}>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <Link href="/upload" className="text-sm font-semibold text-bb-link hover:underline">
            ← Uploads
          </Link>
          <h1 className="truncate text-2xl font-extrabold">{u.source}</h1>
          <p className="truncate text-sm text-bb-muted">
            {u.name} · {state.pages.length} page{state.pages.length === 1 ? "" : "s"} · {state.drafts.length} questions found ·{" "}
            {counts.published} published
          </p>
        </div>
        {ready.length > 0 && (
          <button className="bb-btn bb-btn-outline" disabled={busy} onClick={() => void publishReady()}>
            Publish all ready ({ready.length})
          </button>
        )}
      </div>

      {(pendingPages > 0 || running || runIssue || skipped.length > 0 || runText) && (
        <section className="mb-5 rounded-2xl bg-bb-subtle p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {running ? runText || "Working…" : pendingPages ? `${pendingPages} page${pendingPages === 1 ? "" : "s"} not read yet` : runText || "All pages read."}
              </p>
              {waiting && (
                <p className="text-sm text-bb-muted">
                  {waiting.reason}. Continuing in {waiting.seconds}s…
                </p>
              )}
              {u.pagesReady < u.planned && !running && (
                <p className="text-sm text-bb-amber-ink">
                  Only {u.pagesReady} of {u.planned} pages finished uploading. To add the rest, upload those pages again as a new file.
                </p>
              )}
            </div>
            {!running && pendingPages > 0 && (
              <label className="flex items-center gap-2 text-sm font-semibold">
                Model
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    try {
                      localStorage.setItem(MODEL_KEY, e.target.value);
                    } catch {
                      // storage blocked
                    }
                  }}
                  className="rounded-md border border-bb-line bg-bb-surface px-2 py-1.5 font-normal"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {running ? (
              <button className="bb-btn bb-btn-outline" onClick={() => (ctl.current.stopped = true)}>
                Pause
              </button>
            ) : (
              pendingPages > 0 && (
                <button className="bb-btn bb-btn-primary" disabled={!aiReady} onClick={() => start(state)}>
                  {state.pages.some((p) => p.extracted) ? "Continue reading" : "Start reading"}
                </button>
              )
            )}
          </div>
          {progress && progress.total > 0 && (running || pendingPages > 0) && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bb-bar">
              <div className="h-full rounded-full bg-bb-blue transition-all" style={{ width: `${(Math.min(progress.done, progress.total) / progress.total) * 100}%` }} />
            </div>
          )}
          {!aiReady && <p className="mt-2 text-sm text-bb-red">Add GEMINI_API_KEY to read pages (README → Uploads).</p>}
          {runIssue && <p className="mt-2 text-sm font-semibold text-bb-red">{runIssue}</p>}
          {skipped.map((s) => (
            <p key={s.pages.join()} className="mt-1 text-sm text-bb-amber-ink">
              Page {s.pages.join(", ")} couldn&apos;t be read: {s.reason} Add its questions by hand with &quot;Add a question&quot;.
            </p>
          ))}
        </section>
      )}

      {message && (
        <p
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm font-semibold ${
            message.tone === "error" ? "bg-bb-red-soft text-bb-red" : "bg-bb-green-soft text-bb-green"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_minmax(0,1fr)]">
        {/* Question list */}
        <aside className="lg:col-span-2 xl:col-span-1">
          <div className="rounded-2xl border border-bb-hair bg-bb-surface xl:sticky xl:top-4">
            <div className="flex flex-wrap gap-1 border-b border-bb-bar p-2 text-xs font-semibold">
              {(
                [
                  ["all", `All ${state.drafts.length}`],
                  ["todo", `To review ${counts.todo}`],
                  ["issues", "Needs a look"],
                  ["published", `Published ${counts.published}`],
                  ["rejected", `Rejected ${counts.rejected}`],
                ] as [Filter, string][]
              ).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-2.5 py-1 ${filter === f ? "bg-bb-ink text-bb-bg" : "hover:bg-bb-bar"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <ul className="flex max-h-[260px] flex-wrap gap-1.5 overflow-y-auto p-2 xl:block xl:max-h-[calc(100dvh-14rem)] xl:space-y-0.5">
              {listed.map((d) => {
                const issues = d.status === "draft" && needsWork(d);
                return (
                  <li key={d.id}>
                    <button
                      onClick={() => void open(d)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                        d.id === selectedId ? "bg-bb-blue-soft font-bold text-bb-link" : "hover:bg-bb-bar"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          d.status === "published" ? "bg-bb-green" : d.status === "rejected" ? "bg-bb-faint" : issues ? "bg-[#e08a00]" : "bg-bb-blue"
                        }`}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">
                        #{d.question.sourceNumber}
                        {d.meta.section ? <span className="font-normal text-bb-muted"> · {d.meta.section}</span> : null}
                      </span>
                      <span className="text-xs font-normal text-bb-muted">p.{d.question.page}</span>
                    </button>
                  </li>
                );
              })}
              {!listed.length && <li className="px-2 py-3 text-sm text-bb-muted">Nothing here yet.</li>}
            </ul>
            <div className="border-t border-bb-bar p-2">
              <button className="w-full rounded-md px-2 py-1.5 text-sm font-semibold text-bb-link hover:bg-bb-bar" onClick={() => void addQuestion()}>
                + Add a question
              </button>
            </div>
          </div>
        </aside>

        {/* Original page */}
        <section className="min-w-0">
          <div className="lg:sticky lg:top-4">
            <div className="mb-2 flex items-center gap-2">
              <button
                className="rounded-md border border-bb-line px-2.5 py-1 text-sm font-semibold disabled:opacity-40"
                disabled={pageIndex <= 0}
                onClick={() => setViewPage(state.pages[pageIndex - 1].page)}
                aria-label="Previous page"
              >
                ‹
              </button>
              <span className="text-sm font-semibold">
                Page {viewPage}
                {page && !page.extracted ? <span className="font-normal text-bb-muted"> · not read yet</span> : null}
              </span>
              <button
                className="rounded-md border border-bb-line px-2.5 py-1 text-sm font-semibold disabled:opacity-40"
                disabled={pageIndex < 0 || pageIndex >= state.pages.length - 1}
                onClick={() => setViewPage(state.pages[pageIndex + 1].page)}
                aria-label="Next page"
              >
                ›
              </button>
              {page?.fileId && selected && (
                <button
                  className={`ml-auto rounded-md px-3 py-1 text-sm font-semibold ${
                    selecting ? "bg-bb-blue text-white" : "border border-bb-line hover:bg-bb-bar"
                  }`}
                  onClick={() => setSelecting((v) => !v)}
                >
                  {selecting ? "Drag around the figure…" : "Select a figure"}
                </button>
              )}
            </div>
            <div className="overflow-y-auto lg:max-h-[calc(100dvh-7rem)]">
              <PageViewer page={page} boxes={boxes} selecting={selecting} onSelect={(b) => void applySelection(b)} />
            </div>
          </div>
        </section>

        {/* Editor */}
        <section className="min-w-0">
          {selected && form ? (
            <div className="rounded-2xl border border-bb-hair bg-bb-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="flex-1 text-lg font-bold">Question {form.sourceNumber}</h2>
                <button className="rounded-md border border-bb-line px-2.5 py-1 text-sm font-semibold" onClick={() => step(-1)} aria-label="Previous question">
                  ‹ Prev
                </button>
                <button className="rounded-md border border-bb-line px-2.5 py-1 text-sm font-semibold" onClick={() => step(1)} aria-label="Next question">
                  Next ›
                </button>
              </div>
              <DraftEditor
                key={selected.id}
                draft={selected}
                form={form}
                onChange={(q) => {
                  setForm(q);
                  setDirty(true);
                }}
                section={section}
                onSection={(s) => {
                  setSection(s);
                  setDirty(true);
                }}
                problems={formProblems}
                dirty={dirty}
                busy={busy}
                onSave={() => void save()}
                onStatus={(s) => void setStatus(s)}
                onAskAi={() => void askAi()}
                aiBusy={aiBusy}
                aiReady={aiReady}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-bb-hair p-10 text-center text-bb-muted">
              {running || pendingPages ? "Questions appear here as pages are read." : "No questions found. Add one by hand from the list."}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
