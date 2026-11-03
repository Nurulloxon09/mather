import { handle, jsonBody } from "@/server/http";
import { createUpload } from "@/server/uploads";

/** Start an upload: { name, source, kind, pageCount } → { id }. Pages are sent separately. */
export async function POST(req: Request) {
  return handle(async () => ({ id: await createUpload(await jsonBody(req)) }));
}
