import { geminiModels, solveQuestion } from "@/server/gemini";
import { fileIdsIn, readFile } from "@/server/files";
import { handle, jsonBody } from "@/server/http";
import { getDraftById, requireDb, saveAiSuggestion } from "@/server/uploads";

export const maxDuration = 120;

/** Ask Gemini to solve a question, as a second opinion on the answer key and a suggested explanation. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const body = await jsonBody(req);
    const models = geminiModels().map((m) => m.id);
    const model = typeof body.model === "string" && models.includes(body.model) ? body.model : models[0];
    const draft = await getDraftById(id);
    const q = draft.question;
    const db = await requireDb();
    const images = [];
    for (const fid of fileIdsIn([q.stem, ...(q.choices ?? [])].join("\n")).slice(0, 6)) {
      const f = await readFile(db, fid);
      if (f) images.push({ mime: f.mime, data: Buffer.from(f.data).toString("base64") });
    }
    return saveAiSuggestion(id, await solveQuestion(q, images, model));
  });
}
