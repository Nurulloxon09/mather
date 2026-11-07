import { cleanGoal } from "@/lib/plan";
import { getGoal, saveGoal } from "@/server/help";
import { handle, jsonBody } from "@/server/http";
import { HttpError } from "@/server/uploads";

/** The score goal, shared across devices when a database is connected. */
export async function GET() {
  return handle(async () => ({ goal: await getGoal() }));
}

export async function PUT(req: Request) {
  return handle(async () => {
    const goal = cleanGoal((await jsonBody(req)).goal);
    if (!goal) throw new HttpError(400, "That goal isn't valid");
    return { goal: await saveGoal(goal) };
  });
}
