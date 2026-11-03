import { cookies } from "next/headers";
import { AUTH_COOKIE, authToken, passcode } from "@/server/auth";

/** { passcode } → sets the unlock cookie when it matches APP_PASSCODE. */
export async function POST(req: Request) {
  const code = passcode();
  const body = (await req.json().catch(() => ({}))) as { passcode?: unknown };
  if (!code) return Response.json({ ok: true });
  if (typeof body.passcode !== "string" || (await authToken(body.passcode)) !== (await authToken(code))) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 800));
    return Response.json({ error: "Wrong passcode" }, { status: 401 });
  }
  (await cookies()).set(AUTH_COOKIE, await authToken(code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return Response.json({ ok: true });
}
