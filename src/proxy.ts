import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, isUnlocked, passcode } from "@/server/auth";

const OPEN = ["/unlock", "/api/unlock"];

/** With APP_PASSCODE set, sends visitors without the unlock cookie to /unlock (API calls get a 401). */
export async function proxy(req: NextRequest) {
  if (!passcode()) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (OPEN.includes(pathname)) return NextResponse.next();
  if (await isUnlocked(req.cookies.get(AUTH_COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Locked" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
