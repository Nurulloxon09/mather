import type { NextRequest } from "next/server";
import { getBankById } from "@/server/bank";
import { geminiConfigured } from "@/server/gemini";
import { getHelp, type HelpKind } from "@/server/help";
import { handle, jsonBody } from "@/server/http";
import { HttpError } from "@/server/uploads";

export const maxDuration = 120;

const KINDS: HelpKind[] = ["hints", "wrong", "desmos"];

/**
 * Practice help for one question: { kind: "hints" } for three hints that stop short of the answer,
 * { kind: "wrong", answer } for why that answer is wrong, { kind: "desmos" } for a Desmos walkthrough.
 * Each is asked of the AI once and then kept.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const body = await jsonBody(req);
    const kind = body.kind as HelpKind;
    if (!KINDS.includes(kind)) throw new HttpError(400, "Unknown kind of help");
    const q = (await getBankById()).get(id);
    if (!q) throw new HttpError(404, "Question not found");
    const answer = typeof body.answer === "string" ? body.answer.trim().slice(0, 8) : "";
    if (kind === "wrong" && !answer) throw new HttpError(400, "Which answer?");
    if (!geminiConfigured()) {
      throw new HttpError(503, "AI help needs a Gemini API key: add GEMINI_API_KEY in Vercel, then redeploy.");
    }
    return getHelp(kind, q, answer, req.nextUrl.origin, req.headers.get("cookie"));
  });
}
