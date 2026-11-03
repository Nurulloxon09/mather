// Finding the hosted database in the environment. Turso's own instructions use TURSO_DATABASE_URL and
// TURSO_AUTH_TOKEN, but integrations (Vercel's Storage tab) may add a prefix or use other names, so
// any variable holding a libsql:// URL counts, with the token taken from its sibling variable.

type Env = Record<string, string | undefined>;

export function findDatabase(env: Env): { url: string; authToken?: string; urlKey: string } | null {
  const keys = Object.keys(env).filter((k) => env[k] && !k.startsWith("NEXT_PUBLIC_"));
  const urlKey =
    keys.find((k) => k === "TURSO_DATABASE_URL") ??
    keys.find((k) => k.endsWith("_TURSO_DATABASE_URL")) ??
    keys.find((k) => /^libsql:\/\//i.test(env[k]!.trim()) && /URL/i.test(k)) ??
    keys.find((k) => /^libsql:\/\//i.test(env[k]!.trim()));
  if (!urlKey) return null;

  const base = urlKey.replace(/(_DATABASE)?_URL$/i, "");
  const tokenKey =
    [`${base}_AUTH_TOKEN`, `${base}_DATABASE_AUTH_TOKEN`, `${base}_TOKEN`].find((k) => env[k]) ??
    keys.find((k) => k === "TURSO_AUTH_TOKEN") ??
    keys.find((k) => k.endsWith("_TURSO_AUTH_TOKEN")) ??
    keys.find((k) => /(TURSO|LIBSQL).*TOKEN$/i.test(k));
  return { url: env[urlKey]!.trim(), authToken: tokenKey ? env[tokenKey]!.trim() : undefined, urlKey };
}
