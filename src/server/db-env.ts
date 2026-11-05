// Finding the hosted database in the environment. Turso's own instructions use TURSO_DATABASE_URL and
// TURSO_AUTH_TOKEN, but integrations (Vercel's Storage tab) may add a prefix or use other names, so
// any variable holding a libsql:// URL counts, with the token taken from its sibling variable.

type Env = Record<string, string | undefined>;

const LIBSQL = /^libsql:\/\//i;
/** Addresses the libSQL client accepts for a hosted database. */
const CLIENT_URL = /^(libsql|https?|wss?):\/\//i;

export function findDatabase(env: Env): { url: string; authToken?: string; urlKey: string } | null {
  const keys = Object.keys(env).filter((k) => env[k] && !k.startsWith("NEXT_PUBLIC_"));
  const value = (k: string) => env[k]!.trim();
  const urlKey =
    keys.find((k) => k === "TURSO_DATABASE_URL") ??
    keys.find((k) => k.endsWith("_TURSO_DATABASE_URL")) ??
    keys.find((k) => LIBSQL.test(value(k)) && /URL/i.test(k)) ??
    keys.find((k) => LIBSQL.test(value(k))) ??
    // Turso also hands out https:// addresses.
    keys.find((k) => /(TURSO|LIBSQL).*URL$/i.test(k) && CLIENT_URL.test(value(k))) ??
    keys.find((k) => /URL$/i.test(k) && /^https?:\/\/[^/]+\.turso\.io/i.test(value(k)));
  if (!urlKey) return null;

  const base = urlKey.replace(/(_DATABASE)?_URL$/i, "");
  const tokenKey =
    [`${base}_AUTH_TOKEN`, `${base}_DATABASE_AUTH_TOKEN`, `${base}_TOKEN`].find((k) => env[k]) ??
    keys.find((k) => k === "TURSO_AUTH_TOKEN") ??
    keys.find((k) => k.endsWith("_TURSO_AUTH_TOKEN")) ??
    keys.find((k) => /(TURSO|LIBSQL).*TOKEN$/i.test(k));
  return { url: value(urlKey), authToken: tokenKey ? value(tokenKey) : undefined, urlKey };
}

/** Why no database was found, so the notice can say what to fix. Names only, never values. */
export type DbHint =
  | { kind: "unreadable"; names: string[] }
  | { kind: "other"; names: string[] }
  | { kind: "preview" }
  | { kind: "missing" };

export function diagnose(env: Env): DbHint {
  const keys = Object.keys(env)
    .filter((k) => env[k] && !k.startsWith("NEXT_PUBLIC_"))
    .sort();
  const turso = keys.filter((k) => /TURSO|LIBSQL/i.test(k));
  if (turso.length) return { kind: "unreadable", names: turso.slice(0, 4) };
  // Vercel's Storage tab also offers Postgres (Neon, Supabase), Redis and others, which this app can't use.
  const other = keys.filter((k) =>
    /^(DATABASE_URL|POSTGRES_URL|POSTGRES_PRISMA_URL|NEON_[A-Z_]*|SUPABASE_URL|MONGODB_URI|MYSQL_URL|KV_URL|REDIS_URL|UPSTASH_REDIS_REST_URL)$/i.test(k),
  );
  if (other.length) return { kind: "other", names: other.slice(0, 3) };
  if (env.VERCEL_ENV === "preview") return { kind: "preview" };
  return { kind: "missing" };
}
