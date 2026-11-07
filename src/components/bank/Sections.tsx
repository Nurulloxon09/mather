"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import GlassFolder, { type ArtPreset, type FolderFile } from "../ui/glass-folder-cards";
import type { ProgressMap } from "@/lib/attempts";
import { SKILLS, type Domain, type Question } from "@/lib/types";

/** The four sections of SAT Math, in the order they're shown. */
const SECTIONS: { domain: Domain; label: string; art: ArtPreset }[] = [
  { domain: "Algebra", label: "Algebra", art: "aurora" },
  { domain: "Advanced Math", label: "Advanced Math", art: "dusk" },
  { domain: "Geometry and Trigonometry", label: "Geometry", art: "glacier" },
  { domain: "Problem-Solving and Data Analysis", label: "Problem Solving", art: "verdant" },
];

/** Skill names short enough for the tab of a sheet. */
const SHORT: Record<string, string> = {
  "Linear equations in one variable": "One-variable equations",
  "Linear equations in two variables": "Two-variable equations",
  "Systems of two linear equations in two variables": "Systems of equations",
  "Linear inequalities in one or two variables": "Linear inequalities",
  "Nonlinear equations in one variable and systems of equations in two variables": "Nonlinear equations",
  "Ratios, rates, proportional relationships, and units": "Ratios, rates, units",
  "One-variable data: Distributions and measures of center and spread": "One-variable data",
  "Two-variable data: Models and scatterplots": "Two-variable data",
  "Probability and conditional probability": "Probability",
  "Inference from sample statistics and margin of error": "Inference from samples",
  "Evaluating statistical claims: Observational studies and experiments": "Statistical claims",
  "Lines, angles, and triangles": "Lines, angles, triangles",
  "Right triangles and trigonometry": "Right triangles & trig",
};

/** A folder shows four sheets: the three biggest topics, then everything in the section at the front. */
const TOPIC_SHEETS = 3;

export type SectionPick = { domain: Domain } | { skill: string };

const questions = (n: number) => (n ? `${n} ${n === 1 ? "question" : "questions"}` : "None yet");

function sectionFiles(domain: Domain, art: ArtPreset, bank: Question[]) {
  const skills = SKILLS[domain];
  const count = (skill: string) => bank.filter((q) => q.skill === skill).length;
  const shown = [...skills]
    .sort((a, b) => count(b) - count(a) || skills.indexOf(a) - skills.indexOf(b))
    .slice(0, TOPIC_SHEETS)
    .sort((a, b) => skills.indexOf(a) - skills.indexOf(b));
  const total = bank.filter((q) => q.domain === domain).length;
  const files: FolderFile[] = [
    ...shown.map((s) => ({ name: SHORT[s] ?? s, meta: questions(count(s)) })),
    { name: `All ${skills.length} topics`, meta: questions(total), art },
  ];
  const picks: SectionPick[] = [...shown.map((skill) => ({ skill })), { domain }];
  return { files, picks, total };
}

function subscribeScheme(cb: () => void) {
  const m = window.matchMedia("(prefers-color-scheme: dark)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
/** Smoked glass on a dark screen, milk glass on a light one. */
function useDark() {
  return useSyncExternalStore(
    subscribeScheme,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );
}

/** Folder width for the space a grid cell has, in 20px steps so the artwork isn't repainted at every pixel. */
function useFolderWidth() {
  const ref = useRef<HTMLLIElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setWidth(Math.max(260, Math.min(380, Math.floor(e.contentRect.width / 20) * 20)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/** The start of Practice: one glass folder per section. Open one, then pick a topic or all of it. */
export function Sections({
  bank,
  progress,
  onPick,
}: {
  bank: Question[];
  progress: ProgressMap;
  onPick: (pick: SectionPick) => void;
}) {
  const dark = useDark();
  const { ref, width } = useFolderWidth();

  return (
    <>
      {/* Open folders fan their sheets upward, so rows keep room above them. */}
      <ul className="mt-10 grid grid-cols-1 justify-items-center gap-x-10 gap-y-12 pb-4 sm:grid-cols-2">
        {SECTIONS.map(({ domain, label, art }, i) => {
          const { files, picks, total } = sectionFiles(domain, art, bank);
          const done = bank.filter((q) => q.domain === domain && progress[q.id]).length;
          return (
            <li
              key={domain}
              ref={i === 0 ? ref : undefined}
              className={`flex w-full max-w-[380px] justify-center ${width ? "" : "aspect-[340/326]"}`}
            >
              {width && (
                <GlassFolder
                  label={label}
                  meta={total ? `${questions(total)}${done ? ` · ${done} done` : ""}` : "No questions yet"}
                  tone={dark ? "dark" : "light"}
                  art={art}
                  seed={i * 7 + 3}
                  files={files}
                  action="none"
                  width={width}
                  appearDelay={i * 90}
                  onFileSelect={(_, index) => onPick(picks[index])}
                />
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
