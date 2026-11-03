import { IMAGE_TYPES, MAX_FILE_BYTES } from "@/server/files";
import { handle } from "@/server/http";
import { HttpError, savePage } from "@/server/uploads";

/**
 * Store one page (multipart): page, text, and for PDFs and images an image with its width and height.
 * Word documents send only text (already converted to the question markup).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const form = await req.formData();
    const image = form.get("image");
    let img: { mime: string; data: Uint8Array } | undefined;
    if (image instanceof File) {
      if (!IMAGE_TYPES.includes(image.type)) throw new HttpError(400, "Page must be an image");
      if (image.size > MAX_FILE_BYTES) throw new HttpError(413, "Page image is too large");
      img = { mime: image.type, data: new Uint8Array(await image.arrayBuffer()) };
    }
    await savePage(id, {
      page: Number(form.get("page")),
      image: img,
      width: Number(form.get("width")) || undefined,
      height: Number(form.get("height")) || undefined,
      text: String(form.get("text") ?? ""),
    });
    return { ok: true };
  });
}
