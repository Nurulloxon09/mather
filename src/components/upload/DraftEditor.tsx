"use client";

import { useState } from "react";
import { Rich } from "../Rich";
import { tex } from "@/lib/rich";
import { correctAnswerTex } from "@/lib/session";
import { DIFFICULTIES, DOMAINS, LETTERS, SKILLS, type ChoiceLetter, type Question } from "@/lib/types";
import type { Draft } from "@/lib/uploads";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-bb-muted">{children}</span>;
}

function Area({
  value,
  onChange,
  rows = 3,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  label: string;
}) {
  const lines = value.split("\n").length;
  return (
    <textarea
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={Math.min(18, Math.max(rows, lines))}
      spellCheck={false}
      className="w-full rounded-md border border-bb-line px-2.5 py-2 font-mono text-[13px] leading-relaxed outline-none focus:border-bb-blue"
    />
  );
}

const select = "w-full rounded-md border border-bb-line bg-bb-surface px-2 py-1.5 text-sm outline-none focus:border-bb-blue";

const splitAnswers = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

function Preview({ q }: { q: Question }) {
  return (
    <div className="space-y-4 rounded-xl border border-bb-hair bg-bb-surface p-5">
      <Rich src={q.stem || "(No question text yet)"} />
      {q.type === "mcq" ? (
        <div className="space-y-2.5">
          {LETTERS.map((l, i) => (
            <div
              key={l}
              className={`flex items-center gap-3 rounded-lg border-[1.5px] px-3 py-2 ${
                q.answer === l ? "border-bb-green bg-bb-green-soft" : "border-bb-ink"
              }`}
            >
              <span className="bb-letter">{l}</span>
              <div className="min-w-0 flex-1">
                <Rich src={q.choices?.[i] ?? ""} className="!text-[16px]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[15px]">
          <span className="font-semibold">Accepted: </span>
          {q.gridAnswers?.length ? (
            <span dangerouslySetInnerHTML={{ __html: tex(correctAnswerTex(q)) }} />
          ) : (
            <span className="text-bb-muted">none yet</span>
          )}
        </p>
      )}
      {q.explanation && (
        <div className="border-t border-bb-bar pt-3">
          <p className="mb-1 text-sm font-bold">Explanation</p>
          <Rich src={q.explanation} className="!text-[15px]" />
        </div>
      )}
    </div>
  );
}

export function DraftEditor({
  draft,
  form,
  onChange,
  section,
  onSection,
  problems,
  dirty,
  busy,
  onSave,
  onStatus,
  onAskAi,
  aiBusy,
  aiReady,
}: {
  draft: Draft;
  form: Question;
  onChange: (q: Question) => void;
  section: string;
  onSection: (s: string) => void;
  problems: string[];
  dirty: boolean;
  busy: boolean;
  onSave: () => void;
  onStatus: (s: Draft["status"]) => void;
  onAskAi: () => void;
  aiBusy: boolean;
  aiReady: boolean;
}) {
  const set = (patch: Partial<Question>) => onChange({ ...form, ...patch });
  // Keep what's typed (e.g. a trailing comma) unless the answers were changed some other way.
  const [gridRaw, setGridRaw] = useState("");
  const answers = form.gridAnswers ?? [];
  const gridText = splitAnswers(gridRaw).join() === answers.join() ? gridRaw : answers.join(", ");
  const m = draft.meta;
  const answerNow = form.type === "mcq" ? form.answer : form.gridAnswers?.join(", ");
  const notes: { tone: "warn" | "info"; text: string }[] = [];
  if (!m.complete) notes.push({ tone: "warn", text: "This question may continue on the next page. Check the end of the text." });
  if (m.figures.length) {
    notes.push({
      tone: "warn",
      text: `${m.figures.length} figure${m.figures.length > 1 ? "s" : ""} not cropped yet. Use "Select a figure" on the page, then drag around it.`,
    });
  }
  if (m.keyConflict && m.keyConflict.join(", ") !== answerNow) {
    notes.push({ tone: "warn", text: `The answer key says ${m.keyConflict.join(", ")}, but the page shows ${answerNow}.` });
  }
  if (m.answerFrom === "key") notes.push({ tone: "info", text: "Answer taken from the answer key." });
  if (m.answerFrom === "page") notes.push({ tone: "info", text: "Answer printed with the question." });
  if (!answerNow) notes.push({ tone: "warn", text: "No answer found on the page or in the answer key." });
  const aiDiffers = m.ai && answerNow && m.ai.answer && m.ai.answer !== answerNow;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            draft.status === "published"
              ? "bg-bb-green-soft text-bb-green"
              : draft.status === "rejected"
                ? "bg-bb-bar text-bb-muted"
                : "bg-bb-blue-soft text-bb-link"
          }`}
        >
          {draft.status === "published" ? "Published" : draft.status === "rejected" ? "Rejected" : "Draft"}
        </span>
        {dirty && <span className="text-xs font-semibold text-bb-amber-ink">Unsaved changes</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {draft.status === "rejected" ? (
            <button className="bb-btn bb-btn-outline !py-1.5 text-sm" disabled={busy} onClick={() => onStatus("draft")}>
              Restore
            </button>
          ) : (
            <>
              <button className="bb-btn bb-btn-outline !py-1.5 text-sm" disabled={busy || !dirty} onClick={onSave}>
                Save
              </button>
              {draft.status === "draft" ? (
                <>
                  <button
                    className="bb-btn !py-1.5 text-sm font-semibold text-bb-red hover:bg-bb-red-soft"
                    disabled={busy}
                    onClick={() => onStatus("rejected")}
                  >
                    Reject
                  </button>
                  <button
                    className="bb-btn bb-btn-primary !py-1.5 text-sm"
                    disabled={busy || problems.length > 0}
                    title={problems.length ? "Fix the problems listed below first" : undefined}
                    onClick={() => onStatus("published")}
                  >
                    Publish
                  </button>
                </>
              ) : (
                <button className="bb-btn bb-btn-outline !py-1.5 text-sm" disabled={busy} onClick={() => onStatus("draft")}>
                  Unpublish
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {(problems.length > 0 || notes.length > 0) && (
        <ul className="space-y-1.5 text-sm">
          {problems.map((p) => (
            <li key={p} className="rounded-md bg-bb-red-soft px-3 py-1.5 text-bb-red">
              {p}
            </li>
          ))}
          {notes.map((n) => (
            <li
              key={n.text}
              className={`rounded-md px-3 py-1.5 ${n.tone === "warn" ? "bg-bb-amber-soft text-bb-amber-ink" : "bg-bb-bar text-bb-muted"}`}
            >
              {n.text}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-[90px_minmax(0,1fr)_90px] gap-3">
        <label>
          <Label>Number</Label>
          <input
            type="number"
            min={0}
            value={form.sourceNumber}
            onChange={(e) => set({ sourceNumber: Number(e.target.value) || 0 })}
            className={select}
          />
        </label>
        <label>
          <Label>Section</Label>
          <input value={section} onChange={(e) => onSection(e.target.value)} className={select} />
        </label>
        <label>
          <Label>Page</Label>
          <input
            type="number"
            min={1}
            value={form.page ?? ""}
            onChange={(e) => set({ page: Number(e.target.value) || undefined })}
            className={select}
          />
        </label>
      </div>

      <div className="flex rounded-full border border-bb-line p-0.5 text-sm font-semibold" role="radiogroup" aria-label="Question type">
        {(["mcq", "spr"] as const).map((t) => (
          <button
            key={t}
            role="radio"
            aria-checked={form.type === t}
            onClick={() =>
              set(
                t === "mcq"
                  ? { type: t, choices: form.choices ?? ["", "", "", ""], gridAnswers: undefined }
                  : { type: t, gridAnswers: form.gridAnswers ?? [], answer: undefined },
              )
            }
            className={`flex-1 rounded-full px-3 py-1.5 ${form.type === t ? "bg-bb-ink text-bb-bg" : "hover:bg-bb-bar"}`}
          >
            {t === "mcq" ? "Multiple choice" : "Grid-in"}
          </button>
        ))}
      </div>

      <label className="block">
        <Label>Question</Label>
        <Area label="Question" value={form.stem} onChange={(v) => set({ stem: v })} rows={5} />
      </label>

      {form.type === "mcq" ? (
        <fieldset className="space-y-2">
          <Label>Choices (select the correct one)</Label>
          {LETTERS.map((l, i) => (
            <div key={l} className="flex items-start gap-2">
              <label className="mt-1.5 flex items-center gap-1.5 text-sm font-bold">
                <input
                  type="radio"
                  name="answer"
                  checked={form.answer === l}
                  onChange={() => set({ answer: l as ChoiceLetter })}
                  className="accent-[var(--bb-green)]"
                />
                {l}
              </label>
              <div className="flex-1">
                <Area
                  label={`Choice ${l}`}
                  value={form.choices?.[i] ?? ""}
                  rows={1}
                  onChange={(v) => {
                    const choices = [...(form.choices ?? ["", "", "", ""])];
                    choices[i] = v;
                    set({ choices });
                  }}
                />
              </div>
            </div>
          ))}
        </fieldset>
      ) : (
        <label className="block">
          <Label>Accepted answers (comma-separated)</Label>
          <input
            value={gridText}
            onChange={(e) => {
              setGridRaw(e.target.value);
              set({ gridAnswers: splitAnswers(e.target.value) });
            }}
            placeholder="e.g. 3/4, 0.75"
            className={select}
          />
        </label>
      )}

      <label className="block">
        <Label>Explanation</Label>
        <Area label="Explanation" value={form.explanation} onChange={(v) => set({ explanation: v })} rows={4} />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          <Label>Domain</Label>
          <select
            value={form.domain}
            onChange={(e) => {
              const domain = e.target.value as Question["domain"];
              set({ domain, skill: SKILLS[domain].includes(form.skill) ? form.skill : SKILLS[domain][0] });
            }}
            className={select}
          >
            {DOMAINS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <Label>Skill</Label>
          <select value={form.skill} onChange={(e) => set({ skill: e.target.value })} className={select}>
            {SKILLS[form.domain].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <Label>Difficulty</Label>
          <select
            value={form.difficulty}
            onChange={(e) => set({ difficulty: e.target.value as Question["difficulty"] })}
            className={select}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <Label>Source</Label>
          <input value={form.source} onChange={(e) => set({ source: e.target.value })} className={select} />
        </label>
      </div>

      <div className="rounded-xl bg-bb-subtle p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex-1 text-sm">
            <strong>Second opinion.</strong> Ask the AI to solve it. Useful for checking the answer key and
            drafting an explanation.
          </p>
          <button className="bb-btn bb-btn-outline !py-1.5 text-sm" disabled={!aiReady || aiBusy} onClick={onAskAi}>
            {aiBusy ? "Solving…" : m.ai ? "Ask again" : "Ask AI"}
          </button>
        </div>
        {m.ai && (
          <div className="mt-3 space-y-3 border-t border-bb-bar pt-3">
            <p className={`text-sm font-semibold ${aiDiffers ? "text-bb-red" : ""}`}>
              AI answer: {m.ai.answer || "?"}
              {aiDiffers ? ` (differs from ${answerNow})` : answerNow ? " (matches)" : ""}
            </p>
            {m.ai.explanation && <Rich src={m.ai.explanation} className="!text-[15px]" />}
            <div className="flex flex-wrap gap-2">
              <button
                className="bb-btn bb-btn-outline !py-1 text-xs"
                onClick={() =>
                  form.type === "mcq"
                    ? LETTERS.includes(m.ai!.answer as ChoiceLetter) && set({ answer: m.ai!.answer as ChoiceLetter })
                    : set({ gridAnswers: [m.ai!.answer] })
                }
              >
                Use this answer
              </button>
              <button className="bb-btn bb-btn-outline !py-1 text-xs" onClick={() => set({ explanation: m.ai!.explanation })}>
                Use this explanation
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label>Preview</Label>
        <Preview q={form} />
      </div>
    </div>
  );
}
