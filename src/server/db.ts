import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Client } from "@libsql/client";
import { diagnose, findDatabase, type DbHint } from "./db-env";

/**
 * Database connection.
 *
 * - `TURSO_DATABASE_URL` (+ `TURSO_AUTH_TOKEN`) set: a hosted Turso/libSQL database.
 *   Other names work too, e.g. from Vercel's Storage tab (see db-env.ts).
 * - Not set, running locally: a SQLite file at `.data/mather.db`.
 * - Not set, running on Vercel: no database. The browser keeps progress and uploads it later.
 */
export type DbMode = "remote" | "local" | "none";

function config(): { mode: DbMode; url?: string; authToken?: string } {
  const found = findDatabase(process.env);
  if (found) {
    return { mode: found.url.startsWith("file:") ? "local" : "remote", url: found.url, authToken: found.authToken };
  }
  if (process.env.VERCEL) return { mode: "none" };
  const dir = path.join(process.cwd(), ".data");
  return { mode: "local", url: `file:${path.join(dir, "mather.db")}` };
}

export function dbMode(): DbMode {
  return config().mode;
}

/** The mode, plus why there's no database when there isn't one (setting names only, never values). */
export type DbStatus = { mode: DbMode; hint?: DbHint };

export function dbStatus(): DbStatus {
  const mode = dbMode();
  return mode === "none" ? { mode, hint: diagnose(process.env) } : { mode };
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
  // Phase 3: uploads, their pages, stored files, and extracted questions.
  [
    `CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source TEXT NOT NULL,
      kind TEXT NOT NULL,
      page_count INTEGER NOT NULL,
      planned INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS upload_pages (
      upload_id TEXT NOT NULL,
      page INTEGER NOT NULL,
      file_id TEXT,
      width INTEGER,
      height INTEGER,
      text TEXT NOT NULL DEFAULT '',
      extracted_at INTEGER,
      PRIMARY KEY (upload_id, page)
    )`,
    `CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      upload_id TEXT,
      kind TEXT NOT NULL,
      mime TEXT NOT NULL,
      data BLOB NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS files_upload ON files (upload_id, kind)`,
    `CREATE TABLE IF NOT EXISTS answer_keys (
      upload_id TEXT NOT NULL,
      section TEXT NOT NULL,
      number INTEGER NOT NULL,
      answers TEXT NOT NULL,
      explanation TEXT NOT NULL,
      page INTEGER,
      PRIMARY KEY (upload_id, section, number)
    )`,
    `CREATE TABLE IF NOT EXISTS uploaded_questions (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL,
      status TEXT NOT NULL,
      section TEXT NOT NULL,
      number INTEGER NOT NULL,
      data TEXT NOT NULL,
      meta TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS uq_upload ON uploaded_questions (upload_id, number)`,
    `CREATE INDEX IF NOT EXISTS uq_status ON uploaded_questions (status)`,
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
