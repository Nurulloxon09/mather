import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Client } from "@libsql/client";

/**
 * Database connection.
 *
 * - `TURSO_DATABASE_URL` (+ `TURSO_AUTH_TOKEN`) set: a hosted Turso/libSQL database.
 *   Names with a prefix (e.g. `STORAGE_TURSO_DATABASE_URL` from a Vercel integration) work too.
 * - Not set, running locally: a SQLite file at `.data/mather.db`.
 * - Not set, running on Vercel: no database. The browser keeps progress and uploads it later.
 */
export type DbMode = "remote" | "local" | "none";

function env(suffix: string) {
  if (process.env[suffix]) return { key: suffix, value: process.env[suffix]! };
  const key = Object.keys(process.env).find((k) => k.endsWith(`_${suffix}`) && process.env[k]);
  return key ? { key, value: process.env[key]! } : undefined;
}

function config(): { mode: DbMode; url?: string; authToken?: string } {
  const url = env("TURSO_DATABASE_URL");
  if (url) {
    const prefix = url.key.slice(0, -"TURSO_DATABASE_URL".length);
    const authToken = process.env[`${prefix}TURSO_AUTH_TOKEN`] ?? env("TURSO_AUTH_TOKEN")?.value;
    return { mode: url.value.startsWith("file:") ? "local" : "remote", url: url.value, authToken };
  }
  if (process.env.VERCEL) return { mode: "none" };
  const dir = path.join(process.cwd(), ".data");
  return { mode: "local", url: `file:${path.join(dir, "mather.db")}` };
}

export function dbMode(): DbMode {
  return config().mode;
}

// Each entry moves the schema up one version. Never edit a released entry; add a new one.
const MIGRATIONS: string[][] = [
  [
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      finished_at INTEGER NOT NULL,
      correct INTEGER NOT NULL,
      total INTEGER NOT NULL,
      data TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS sessions_finished ON sessions (finished_at)`,
    `CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      answer TEXT,
      correct INTEGER NOT NULL,
      time_ms INTEGER NOT NULL,
      marked INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS attempts_question ON attempts (question_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS attempts_created ON attempts (created_at)`,
  ],
];

async function migrate(client: Client) {
  await client.execute(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const row = await client.execute(`SELECT value FROM meta WHERE key = 'schema_version'`);
  let version = row.rows.length ? Number(row.rows[0].value) : 0;
  while (version < MIGRATIONS.length) {
    version++;
    await client.batch(
      [
        ...MIGRATIONS[version - 1],
        {
          sql: `INSERT INTO meta (key, value) VALUES ('schema_version', ?)
                ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
          args: [String(version)],
        },
      ],
      "write",
    );
  }
}

async function connect(): Promise<Client | null> {
  const { mode, url, authToken } = config();
  if (mode === "none" || !url) return null;
  let client: Client;
  if (mode === "remote") {
    // HTTP client: no native code, works in any serverless runtime.
    const { createClient } = await import("@libsql/client/web");
    client = createClient({ url, authToken });
  } else {
    const file = url.replace(/^file:/, "");
    mkdirSync(path.dirname(file), { recursive: true });
    const { createClient } = await import("@libsql/client");
    client = createClient({ url });
  }
  await migrate(client);
  return client;
}

// One connection per server process (kept on globalThis so dev reloads reuse it).
const g = globalThis as unknown as { __matherDb?: Promise<Client | null> };

export function getDb(): Promise<Client | null> {
  if (!g.__matherDb) {
    g.__matherDb = connect().catch((err) => {
      g.__matherDb = undefined;
      throw err;
    });
  }
  return g.__matherDb;
}
