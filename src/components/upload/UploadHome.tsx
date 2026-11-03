"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocalDate } from "../LocalDate";
import { api, withRetry } from "@/lib/client/api";
import { parsePageRanges, type UploadKind, type UploadSummary } from "@/lib/uploads";

type Picked =
  | { kind: "pdf"; file: File; pages: number }
  | { kind: "docx"; file: File }
  | { kind: "images"; files: File[] };

function pick(files: File[]): Picked | string {
  if (!files.length) return "No file chosen";
  const isImage = (f: File) => f.type.startsWith("image/");
  if (files.every(isImage)) return { kind: "images", files: [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })) };
  if (files.length > 1) return "Choose one PDF or Word file, or several images";
  const f = files[0];
  if (f.type === "application/pdf" || /\.pdf$/i.test(f.name)) return { kind: "pdf", file: f, pages: 0 };
  if (/\.docx$/i.test(f.name)) return { kind: "docx", file: f };
  if (/\.doc$/i.test(f.name)) return "Old .doc files aren't supported. Save it as .docx or PDF first.";
  return "Unsupported file. Use a PDF, a Word .docx file, or images.";
}

const baseName = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();

function status(u: UploadSummary) {
  if (u.pagesReady < u.planned) return { label: `Interrupted: ${u.pagesReady} of ${u.planned} pages uploaded`, tone: "warn" };
  if (u.pagesExtracted < u.pagesReady) return { label: `Reading pages: ${u.pagesExtracted} of ${u.pagesReady} done`, tone: "busy" };
  if (u.drafts) return { label: `${u.drafts} to review`, tone: "todo" };
  return { label: "All reviewed", tone: "done" };
}

export function UploadHome({
  uploads,
  geminiReady,
}: {
  uploads: UploadSummary[] | null;
  geminiReady: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [source, setSource] = useState("");
  const [range, setRange] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ label: string; done: number; total: number } | null>(null);
  const [drag, setDrag] = useState(false);

  const choose = async (files: File[]) => {
    setError("");
    const p = pick(files);
    if (typeof p === "string") {
      setError(p);
      setPicked(null);
      return;
    }
    const first = p.kind === "images" ? p.files[0] : p.file;
    if (!source) setSource(baseName(first.name));
    if (p.kind === "pdf") {
      try {
        const { openPdf } = await import("@/lib/client/pages");
        const pdf = await openPdf(p.file);
        p.pages = pdf.numPages;
        await pdf.destroy();
      } catch {
        setError("Couldn't open that PDF. Is it password-protected or damaged?");
        return;
      }
    }
    setPicked(p);
  };

  const pageList = picked?.kind === "pdf" ? parsePageRanges(range, picked.pages) : null;

  const start = async () => {
    if (!picked || !source.trim()) return;
    setError("");
    try {
      if (picked.kind === "pdf") {
        const pages = pageList;
        if (!pages?.length) throw new Error("Check the page range, e.g. 5-40, 120-135");
        const { openPdf } = await import("@/lib/client/pages");
        const pdf = await openPdf(picked.file);
        const { id } = await api.createUpload({
          name: picked.file.name,
          source: source.trim(),
          kind: "pdf",
          pageCount: pdf.numPages,
          planned: pages.length,
        });
        for (const [i, n] of pages.entries()) {
          setProgress({ label: `Preparing page ${n}`, done: i, total: pages.length });
          const r = await pdf.render(n);
          const form = new FormData();
          form.set("page", String(n));
          form.set("image", r.blob, `page-${n}.jpg`);
          form.set("width", String(r.width));
          form.set("height", String(r.height));
          form.set("text", r.text);
          await withRetry(() => api.uploadPage(id, form));
        }
        await pdf.destroy();
        router.push(`/upload/${id}?start=1`);
      } else if (picked.kind === "images") {
        const { imageToPage } = await import("@/lib/client/pages");
        const n = picked.files.length;
        const name = n > 1 ? `${picked.files[0].name} + ${n - 1} more` : picked.files[0].name;
        const { id } = await api.createUpload({ name, source: source.trim(), kind: "images", pageCount: n, planned: n });
        for (const [i, f] of picked.files.entries()) {
          setProgress({ label: `Preparing image ${i + 1}`, done: i, total: n });
          const r = await imageToPage(f);
          const form = new FormData();
          form.set("page", String(i + 1));
          form.set("image", r.blob, `page-${i + 1}.jpg`);
          form.set("width", String(r.width));
          form.set("height", String(r.height));
          form.set("text", "");
          await withRetry(() => api.uploadPage(id, form));
        }
        router.push(`/upload/${id}?start=1`);
      } else {
        setProgress({ label: "Reading the Word file", done: 0, total: 1 });
        const { convertDocx } = await import("@/lib/client/docx");
        const chunks = await convertDocx(picked.file);
        if (!chunks.length) throw new Error("That Word file looks empty");
        const { id } = await api.createUpload({
          name: picked.file.name,
          source: source.trim(),
          kind: "docx",
          pageCount: chunks.length,
          planned: chunks.length,
        });
        for (const [i, c] of chunks.entries()) {
          setProgress({ label: `Preparing part ${i + 1}`, done: i, total: chunks.length });
          let text = c.text;
          for (const img of c.images) {
            const up = await withRetry(() => api.uploadFile(id, img.blob, img.token));
            const w = Math.round(Math.max(120, Math.min(640, img.width)));
            text = text.split(img.token).join(`![figure](${up.url}){w=${w}}`);
          }
          const form = new FormData();
          form.set("page", String(i + 1));
          form.set("text", text);
          await withRetry(() => api.uploadPage(id, form));
        }
        router.push(`/upload/${id}?start=1`);
      }
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
      setProgress(null);
    }
  };

  const remove = async (u: UploadSummary) => {
    const keep = u.published ? ` The ${u.published} published question(s) stay in the bank.` : "";
    if (!confirm(`Delete "${u.name}" and its unpublished questions?${keep}`)) return;
    try {
      await api.deleteUpload(u.id);
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const busy = !!progress;
  const label = picked
    ? picked.kind === "images"
      ? `${picked.files.length} image${picked.files.length > 1 ? "s" : ""}`
      : `${picked.file.name}${picked.kind === "pdf" ? ` · ${picked.pages} pages` : ""}`
    : "";

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {!geminiReady && (
        <div className="rounded-xl border border-[#e6b800] bg-[#fff8d6] px-5 py-4 text-sm">
          <strong>Add a Gemini API key to read uploads.</strong> Create a free key at Google AI Studio and add it
          to Vercel as <code>GEMINI_API_KEY</code>, then redeploy (README → Uploads). You can still upload now and
          start reading later.
        </div>
      )}
      <section className="rounded-2xl border border-bb-line bg-white p-6">
        <h2 className="mb-1 text-lg font-bold">Add questions from a book</h2>
        <p className="mb-5 text-sm text-bb-muted">
          Upload a PDF, a Word file, or photos of pages. The AI reads the questions, answers and answer key;
          you check each one next to the original page before it goes into the bank.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (!busy) void choose(Array.from(e.dataTransfer.files));
          }}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center ${
            drag ? "border-bb-blue bg-bb-blue-soft" : "border-bb-line"
          }`}
        >
          <input
            ref={input}
            type="file"
            multiple
            accept=".pdf,.docx,image/*"
            className="hidden"
            onChange={(e) => void choose(Array.from(e.target.files ?? []))}
          />
          <p className="font-semibold">{label || "Drop a PDF, .docx, or page images here"}</p>
          <button
            className="bb-btn bb-btn-outline mt-3 !py-1.5 text-sm"
            onClick={() => input.current?.click()}
            disabled={busy}
          >
            {picked ? "Choose a different file" : "Choose file"}
          </button>
        </div>

        {picked && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Source name
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Math Hard Book"
                className="mt-1 w-full rounded-md border border-bb-line px-3 py-2 font-normal outline-none focus:border-bb-blue"
              />
              <span className="mt-1 block text-xs font-normal text-bb-muted">Shown with each question and used as the Source filter.</span>
            </label>
            {picked.kind === "pdf" && (
              <label className="block text-sm font-semibold">
                Pages
                <input
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder={`All ${picked.pages} pages`}
                  className="mt-1 w-full rounded-md border border-bb-line px-3 py-2 font-normal outline-none focus:border-bb-blue"
                />
                <span className={`mt-1 block text-xs font-normal ${pageList ? "text-bb-muted" : "text-bb-red"}`}>
                  {pageList
                    ? `${pageList.length} page${pageList.length === 1 ? "" : "s"}. Include the answer key pages too, e.g. 5-60, 140-152.`
                    : "Use page numbers and ranges, e.g. 5-60, 140-152"}
                </span>
              </label>
            )}
          </div>
        )}

        {error && <p className="mt-4 text-sm font-semibold text-bb-red">{error}</p>}

        {progress ? (
          <div className="mt-5">
            <div className="mb-1 flex text-sm">
              <span className="flex-1 font-semibold">{progress.label}…</span>
              <span className="text-bb-muted">
                {progress.done}/{progress.total}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-bb-bar">
              <div
                className="h-full rounded-full bg-bb-blue transition-all"
                style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-bb-muted">Keep this tab open until the pages are uploaded.</p>
          </div>
        ) : (
          picked && (
            <button
              className="bb-btn bb-btn-primary mt-5"
              disabled={!source.trim() || (picked.kind === "pdf" && !pageList?.length)}
              onClick={() => void start()}
            >
              Upload and read
            </button>
          )
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Uploads</h2>
        {!uploads?.length ? (
          <p className="text-sm text-bb-muted">{uploads ? "Nothing uploaded yet." : "Connect a database to upload files."}</p>
        ) : (
          <ul className="divide-y divide-bb-bar overflow-hidden rounded-2xl border border-bb-line bg-white">
            {uploads.map((u) => {
              const s = status(u);
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/upload/${u.id}`} className="font-semibold hover:text-bb-blue hover:underline">
                      {u.source}
                    </Link>
                    <p className="truncate text-sm text-bb-muted">
                      {u.name} · {kindLabel(u.kind)} · <LocalDate ms={u.createdAt} dateOnly />
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      s.tone === "warn"
                        ? "bg-[#fff1cc] text-[#8a6100]"
                        : s.tone === "busy"
                          ? "bg-bb-blue-soft text-bb-blue"
                          : s.tone === "todo"
                            ? "bg-[#fde8eb] text-bb-red"
                            : "bg-[#e7f5ef] text-bb-green"
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="text-sm text-bb-muted">{u.published} published</span>
                  <Link href={`/upload/${u.id}`} className="bb-btn bb-btn-primary !px-4 !py-1.5 text-sm">
                    {u.drafts || u.pagesExtracted < u.pagesReady ? "Open" : "View"}
                  </Link>
                  <button className="text-sm font-semibold text-bb-red hover:underline" onClick={() => void remove(u)}>
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function kindLabel(k: UploadKind) {
  return k === "pdf" ? "PDF" : k === "docx" ? "Word" : "Images";
}
