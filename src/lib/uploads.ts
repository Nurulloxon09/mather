import type { Question } from "./types";

// Types and pure helpers shared by the upload page, the review screen and the server.

export type UploadKind = "pdf" | "images" | "docx";
export type DraftStatus = "draft" | "published" | "rejected";

/** A figure the AI found, waiting to be cropped out of its page image. Box is [ymin, xmin, ymax, xmax] in 0–1000. */
export type PendingFigure = { label: string; page: number; box: [number, number, number, number] };

export type DraftMeta = {
  /** Chapter or section heading the question was printed under (numbers restart per section). */
  section: string;
  /** False when the question looked cut off at the edge of the pages the AI saw. */
  complete: boolean;
  figures: PendingFigure[];
  /** Where the answer came from: printed with the question, the answer key, or typed in review. */
  answerFrom: "page" | "key" | "editor" | null;
  /** The answer key's answer when it disagrees with the one printed with the question. */
  keyConflict?: string[];
  /** Saved by hand in the review screen; automatic updates leave it alone after that. */
  edited: boolean;
  ai?: { answer: string; explanation: string; at: number };
};

export type Draft = {
  id: string;
  uploadId: string;
  status: DraftStatus;
  question: Question;
  meta: DraftMeta;
  updatedAt: number;
};

export type UploadPage = {
  page: number;
  fileId: string | null;
  width: number | null;
  height: number | null;
  extracted: boolean;
  /** Content of a Word document chunk (PDF and image pages are shown as images instead). */
  text?: string;
};

export type UploadSummary = {
  id: string;
  name: string;
  source: string;
  kind: UploadKind;
  /** Pages in the whole document, and how many of them were chosen for upload. */
  pageCount: number;
  planned: number;
  pagesReady: number;
  pagesExtracted: number;
  drafts: number;
  published: number;
  rejected: number;
  createdAt: number;
};

export type UploadState = { upload: UploadSummary; pages: UploadPage[]; drafts: Draft[] };

export const fileUrl = (id: string) => `/api/files/${id}`;

/** "1-5, 8, 10-12" → [1,2,3,4,5,8,10,11,12] within 1..max. Empty input means every page. */
export function parsePageRanges(input: string, max: number): number[] | null {
  const s = input.trim();
  if (!s) return Array.from({ length: max }, (_, i) => i + 1);
  const out = new Set<number>();
  for (const part of s.split(/[,;\s]+/).filter(Boolean)) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(part);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < a) return null;
    for (let p = a; p <= Math.min(b, max); p++) out.add(p);
  }
  return [...out].sort((x, y) => x - y);
}

/**
 * Overlapping windows of pages sent to the AI together, so a question that runs
 * onto the next page is seen whole at least once.
 */
export function pageWindows(pages: number[], size = 4, overlap = 1): number[][] {
  if (pages.length <= size) return pages.length ? [pages] : [];
  const out: number[][] = [];
  const step = Math.max(1, size - overlap);
  for (let i = 0; i < pages.length; i += step) {
    out.push(pages.slice(i, i + size));
    if (i + size >= pages.length) break;
  }
  return out;
}

/** Section names as printed vary ("Chapter 2: Algebra", "ALGEBRA", "Algebra — Answers"); compare a core form. */
export function normalizeSection(s: string) {
  return s
    .toLowerCase()
    .replace(/answer\s*keys?|answers?|explanations?|solutions?|chapter|section|part|unit|practice|questions?/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const FIGURE_RE = /\[\[\s*(FIGURE\s*\d+)\s*\]\]/gi;

/** Display width for a cropped figure: its share of the page width, scaled to the question column. */
export function figureWidth(box: [number, number, number, number]) {
  const frac = (box[3] - box[1]) / 1000;
  return Math.round(Math.min(640, Math.max(140, frac * 780)));
}

/** Clean an answer the AI read off the page: a letter for multiple choice, a grid-in value otherwise. */
export function cleanAnswer(raw: string, type: Question["type"]): string | null {
  let s = raw.trim().replace(/[−–—]/g, "-");
  if (type === "mcq") {
    const m = /^\(?([A-Da-d])\)?[.):]?(\s|$)/.exec(s) ?? /^(?:choice|option)\s*\(?([A-D])\)?/i.exec(s);
    return m ? m[1].toUpperCase() : null;
  }
  s = s.replace(/\s+/g, "").replace(/^\$|\$$/g, "").replace(/,/g, "");
  const frac = /^\\d?frac\{(-?\d+)\}\{(\d+)\}$/.exec(s);
  if (frac) s = `${frac[1]}/${frac[2]}`;
  return /^-?(\d+(\.\d*)?|\.\d+|\d+\/\d+)$/.test(s) ? s : null;
}

/** Question shape before any AI output arrives, used when adding a question by hand. */
export function blankQuestion(id: string, source: string, uploadId: string): Question {
  return {
    id,
    source,
    sourceNumber: 0,
    domain: "Algebra",
    skill: "Linear equations in one variable",
    difficulty: "Medium",
    type: "mcq",
    stem: "",
    choices: ["", "", "", ""],
    explanation: "",
    uploadId,
  };
}
