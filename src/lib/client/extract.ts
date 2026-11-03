import { figureWidth, fileUrl, pageWindows, type UploadState } from "../uploads";
import { api, ApiError } from "./api";
import { cropImage } from "./pages";

// Drives extraction from the browser: sends overlapping windows of pages to the server one at a
// time, waits out rate limits, splits windows the AI can't finish, and crops the figures it finds.

export type RunnerUpdate =
  | { type: "status"; text: string }
  | { type: "progress"; done: number; total: number }
  | { type: "waiting"; seconds: number; reason: string }
  | { type: "state"; state: UploadState }
  | { type: "skipped"; pages: number[]; reason: string }
  | { type: "stopped"; reason: string; fatal: boolean }
  | { type: "done" };

export type Control = { stopped: boolean };

const WINDOW = 4;
const OVERLAP = 1;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function wait(seconds: number, reason: string, ctl: Control, on: (u: RunnerUpdate) => void) {
  for (let s = Math.ceil(seconds); s > 0 && !ctl.stopped; s--) {
    on({ type: "waiting", seconds: s, reason });
    await sleep(1000);
  }
  on({ type: "waiting", seconds: 0, reason: "" });
}

/** Crop every figure the AI found but nobody has cropped yet. */
export async function cropPendingFigures(state: UploadState, on: (u: RunnerUpdate) => void) {
  let changed = false;
  for (const d of state.drafts) {
    if (d.status === "rejected" || !d.meta.figures.length) continue;
    for (const f of d.meta.figures) {
      const page = state.pages.find((p) => p.page === f.page);
      if (!page?.fileId) continue;
      on({ type: "status", text: `Cropping a figure for question ${d.question.sourceNumber}` });
      try {
        const crop = await cropImage(fileUrl(page.fileId), f.box);
        const up = await api.uploadFile(state.upload.id, crop.blob, "figure.png");
        await api.resolveFigure(d.id, f.label, up.id, figureWidth(f.box));
        changed = true;
      } catch {
        // Left pending; the review screen shows it and it can be cropped by hand.
      }
    }
  }
  return changed ? api.state(state.upload.id) : state;
}

export async function runExtraction(initial: UploadState, model: string, ctl: Control, on: (u: RunnerUpdate) => void) {
  const id = initial.upload.id;
  let state = await cropPendingFigures(initial, on);
  const isDone = (w: number[]) => w.every((n) => state.pages.find((p) => p.page === n)?.extracted);
  const queue = pageWindows(
    state.pages.map((p) => p.page),
    WINDOW,
    OVERLAP,
  ).filter((w) => !isDone(w));
  let total = queue.length;
  let done = 0;
  let failures = 0;
  on({ type: "progress", done, total });

  while (queue.length) {
    if (ctl.stopped) return on({ type: "stopped", reason: "Paused", fatal: false });
    const w = queue[0];
    if (isDone(w)) {
      queue.shift();
      continue;
    }
    const label = w.length > 1 ? `pages ${w[0]}–${w[w.length - 1]}` : `page ${w[0]}`;
    on({ type: "status", text: `Reading ${label}…` });
    try {
      const r = await api.extract(id, w, model);
      queue.shift();
      failures = 0;
      done++;
      on({ type: "status", text: `Read ${label}: ${r.found} question${r.found === 1 ? "" : "s"}${r.keys ? `, ${r.keys} answer-key entries` : ""}` });
    } catch (err) {
      const e = err instanceof ApiError ? err : new ApiError(String(err), 0);
      if (e.kind === "rate") {
        await wait(e.retryAfter ?? 30, e.message, ctl, on);
        continue;
      }
      if (e.kind === "daily" || e.kind === "auth" || e.kind === "config" || e.status === 401 || e.status === 503) {
        return on({ type: "stopped", reason: e.message, fatal: true });
      }
      if ((e.kind === "too-long" || e.kind === "blocked" || e.kind === "bad-output") && w.length > 1) {
        // Try the pages in smaller groups.
        const half = Math.ceil(w.length / 2);
        queue.splice(0, 1, w.slice(0, half), w.slice(half - (w.length > 2 ? 1 : 0)));
        total++;
        on({ type: "progress", done, total });
        continue;
      }
      if (e.kind === "too-long" || e.kind === "blocked" || e.kind === "bad-output") {
        queue.shift();
        done++;
        on({ type: "skipped", pages: w, reason: e.message });
        continue;
      }
      if (++failures >= 3) return on({ type: "stopped", reason: e.message, fatal: false });
      await wait(5 * failures, `${e.message} Retrying…`, ctl, on);
      continue;
    }
    on({ type: "progress", done, total });
    state = await api.state(id);
    on({ type: "state", state });
    state = await cropPendingFigures(state, on);
    on({ type: "state", state });
  }
  on({ type: "progress", done: total, total });
  on({ type: "done" });
}
