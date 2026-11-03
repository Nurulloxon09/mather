import { handle } from "@/server/http";
import { IMAGE_TYPES, MAX_FILE_BYTES, saveFile } from "@/server/files";
import { HttpError, requireDb } from "@/server/uploads";

/** Upload a cropped figure (multipart: file, uploadId). */
export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData();
    const file = form.get("file");
    const uploadId = String(form.get("uploadId") ?? "") || null;
    if (!(file instanceof File) || !IMAGE_TYPES.includes(file.type)) throw new HttpError(400, "Expected an image");
    if (file.size > MAX_FILE_BYTES) throw new HttpError(413, "Image is too large");
    const db = await requireDb();
    const id = await saveFile(db, {
      uploadId,
      kind: "figure",
      mime: file.type,
      data: new Uint8Array(await file.arrayBuffer()),
    });
    return { id, url: `/api/files/${id}` };
  });
}
