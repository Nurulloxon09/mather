import type { Goal } from "../plan";
import type { Draft, UploadKind, UploadState } from "../uploads";

// Browser calls to the upload and review endpoints.

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public kind?: string,
    public retryAfter?: number,
    public details?: string[],
  ) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("Couldn't reach the server. Check your connection.", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status, body.kind, body.retryAfter, body.details);
  }
  return body as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  createUpload: (b: { name: string; source: string; kind: UploadKind; pageCount: number; planned: number }) =>
    call<{ id: string }>("/api/uploads", json("POST", b)),
  uploadPage: (id: string, form: FormData) => call<{ ok: true }>(`/api/uploads/${id}/pages`, { method: "POST", body: form }),
  uploadFile: (uploadId: string, blob: Blob, name: string) => {
    const form = new FormData();
    form.set("file", blob, name);
    form.set("uploadId", uploadId);
    return call<{ id: string; url: string }>("/api/files", { method: "POST", body: form });
  },
  state: (id: string) => call<UploadState>(`/api/uploads/${id}`, { cache: "no-store" }),
  extract: (id: string, pages: number[], model: string) =>
    call<{ added: number; updated: number; keys: number; found: number }>(`/api/uploads/${id}/extract`, json("POST", { pages, model })),
  deleteUpload: (id: string) => call<{ ok: true }>(`/api/uploads/${id}`, { method: "DELETE" }),
  addQuestion: (uploadId: string, page: number) => call<Draft>(`/api/uploads/${uploadId}/questions`, json("POST", { page })),
  updateQuestion: (id: string, body: { question?: unknown; status?: Draft["status"]; section?: string }) =>
    call<Draft>(`/api/questions/${id}`, json("PATCH", body)),
  resolveFigure: (id: string, label: string, fileId: string, width: number) =>
    call<Draft>(`/api/questions/${id}/figures`, json("POST", { label, fileId, width })),
  solve: (id: string, model: string) => call<Draft>(`/api/questions/${id}/solve`, json("POST", { model })),
  help: <T>(questionId: string, body: { kind: "hints" | "wrong" | "desmos"; answer?: string }) =>
    call<T>(`/api/questions/${encodeURIComponent(questionId)}/help`, json("POST", body)),
  saveGoal: (goal: Goal) => call<{ goal: Goal }>("/api/settings", json("PUT", { goal })),
};

/** Retry a call a few times on network errors and server hiccups (not on 4xx answers). */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (i >= tries || (status >= 400 && status < 500)) throw err;
      await new Promise((r) => setTimeout(r, 800 * i));
    }
  }
}
