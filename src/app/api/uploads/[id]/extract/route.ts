import { extractPages, geminiModels } from "@/server/gemini";
import { handle, jsonBody } from "@/server/http";
import { HttpError, loadPagesForAi, recordExtraction, sectionHints } from "@/server/uploads";

// Reading several pages can take the AI a minute or two.
export const maxDuration = 300;

/** Send a few consecutive pages to Gemini and store the questions and answer-key entries it finds. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const body = await jsonBody(req);
    const pages = Array.isArray(body.pages) ? body.pages.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
    if (!pages.length || pages.length > 8) throw new HttpError(400, "Send 1 to 8 pages");
    const models = geminiModels().map((m) => m.id);
    const model = typeof body.model === "string" && models.includes(body.model) ? body.model : models[0];

    const input = await loadPagesForAi(id, pages);
    const hints = await sectionHints(id, Math.min(...pages));
    const result = await extractPages(input, model, hints);
    const saved = await recordExtraction(id, pages, result);
    return { ...saved, found: result.questions.length };
  });
}
