import { handle, jsonBody } from "@/server/http";
import { addDraft } from "@/server/uploads";

/** Add a blank question by hand (for one the AI missed): { page } → the new draft. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const body = await jsonBody(req);
    return addDraft(id, Number(body.page) || 1);
  });
}
