// Optional passcode lock. When APP_PASSCODE is set, every page and API call needs a cookie
// holding a signature of the passcode (see proxy.ts). Without it, the app is open.

export const AUTH_COOKIE = "mather_key";

export function passcode() {
  return process.env.APP_PASSCODE ?? "";
}

/** The cookie value for a passcode: HMAC-SHA256(passcode, fixed message), hex. */
export async function authToken(code: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(code), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("mather-unlock-v1"));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isUnlocked(cookie: string | undefined) {
  const code = passcode();
  if (!code) return true;
  if (!cookie) return false;
  const expected = await authToken(code);
  if (cookie.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= cookie.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
