import { handle, jsonBody } from "@/server/http";
import { updateDraft } from "@/server/uploads";

/** Save edits and/or change status (draft, published, rejected). Publishing runs the question checks. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => updateDraft((await params).id, await jsonBody(req)));
}
