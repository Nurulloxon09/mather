import { syncProgress } from "@/server/progress";

/** Receives attempts and finished sessions queued in the browser (see lib/outbox.ts). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  try {
    const result = await syncProgress(body);
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
    return Response.json(result);
  } catch (err) {
    console.error("sync failed", err);
    return Response.json({ error: "database-error" }, { status: 500 });
  }
}
