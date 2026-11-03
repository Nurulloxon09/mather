import { getDb } from "@/server/db";
import { readFile } from "@/server/files";

/** Serves stored images. File contents never change, so browsers and the CDN may cache them forever. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const file = db && /^[A-Za-z0-9]{1,40}$/.test(id) ? await readFile(db, id) : null;
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: {
      "content-type": file.mime,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
