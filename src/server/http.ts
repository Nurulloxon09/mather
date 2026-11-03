import "server-only";
import { GeminiError } from "./gemini";
import { HttpError } from "./uploads";

/** Run a route handler body, turning known errors into JSON responses the pages can show. */
export async function handle(fn: () => Promise<unknown>) {
  try {
    const out = await fn();
    return out instanceof Response ? out : Response.json(out ?? { ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return Response.json({ error: err.message, details: err.details }, { status: err.status });
    }
    if (err instanceof GeminiError) {
      const status =
        err.kind === "rate" || err.kind === "daily"
          ? 429
          : err.kind === "too-long"
            ? 422
            : err.kind === "config" || err.kind === "auth"
              ? 503
              : 502;
      return Response.json({ error: err.message, kind: err.kind, retryAfter: err.retryAfter }, { status });
    }
    console.error(err);
    return Response.json({ error: "Something went wrong on the server" }, { status: 500 });
  }
}

export async function jsonBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const v = await req.json();
    if (v && typeof v === "object") return v as Record<string, unknown>;
  } catch {
    // fall through
  }
  throw new HttpError(400, "Expected a JSON body");
}
