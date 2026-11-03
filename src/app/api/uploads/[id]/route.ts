import { handle } from "@/server/http";
import { deleteUpload, getUploadState } from "@/server/uploads";

type Ctx = { params: Promise<{ id: string }> };

/** Upload summary, its pages, and every question found so far. */
export async function GET(_req: Request, { params }: Ctx) {
  return handle(async () => getUploadState((await params).id));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  return handle(async () => {
    await deleteUpload((await params).id);
    return { ok: true };
  });
}
