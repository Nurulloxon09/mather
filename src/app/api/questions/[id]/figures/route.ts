import { handle, jsonBody } from "@/server/http";
import { HttpError, resolveFigure } from "@/server/uploads";

/** Swap a [[FIGURE n]] placeholder for an uploaded crop: { label, fileId, width }. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const body = await jsonBody(req);
    const label = String(body.label ?? "");
    const fileId = String(body.fileId ?? "");
    if (!/^FIGURE \d+$/.test(label) || !/^[A-Za-z0-9]{1,40}$/.test(fileId)) throw new HttpError(400, "Bad figure");
    return resolveFigure(id, label, fileId, Number(body.width) || 320);
  });
}
