import "server-only";
import { randomUUID } from "node:crypto";
import type { Db } from "./db";

// Images (page renders and cropped figures) live in the database's `files` table and are
// served by /api/files/[id]. Files never change, so they can be cached forever.

export type FileKind = "page" | "figure";
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

export const newId = () => randomUUID().replace(/-/g, "").slice(0, 20);

export async function saveFile(
  db: Db,
  file: { uploadId: string | null; kind: FileKind; mime: string; data: Uint8Array },
) {
  const id = newId();
  await db.execute({
    sql: `INSERT INTO files (id, upload_id, kind, mime, data, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, file.uploadId, file.kind, file.mime, file.data, Date.now()],
  });
  return id;
}

export async function readFile(db: Db, id: string): Promise<{ mime: string; data: Uint8Array } | null> {
  const res = await db.execute({ sql: `SELECT mime, data FROM files WHERE id = ?`, args: [id] });
  if (!res.rows.length) return null;
  const raw = res.rows[0].data as ArrayBuffer | Uint8Array;
  return { mime: String(res.rows[0].mime), data: raw instanceof Uint8Array ? raw : new Uint8Array(raw) };
}

/** Image files referenced by `/api/files/<id>` links in some markup. */
export function fileIdsIn(src: string) {
  return [...src.matchAll(/\/api\/files\/([A-Za-z0-9]+)/g)].map((m) => m[1]);
}
