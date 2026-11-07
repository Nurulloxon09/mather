import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Client, InStatement } from "@libsql/client";
import type { Pool, PoolClient } from "pg";
import { diagnose, findDatabase, findPostgres, type DbHint } from "./db-env";
import { jsonField, toPgDdl, toPgPlaceholders, type Engine } from "./sql";

/**
 * Database connection.
 *
 * - A Postgres address (`DATABASE_URL`, e.g. from Vercel's Neon integration): that database.
 * - `TURSO_DATABASE_URL` (+ `TURSO_AUTH_TOKEN`): a hosted Turso/libSQL database.
 *   Other names work too, e.g. with a prefix from Vercel's Storage tab (see db-env.ts).
 * - Neither, running locally: a SQLite file at `.data/mather.db`.
 * - Neither, running on Vercel: no database. The browser keeps progress and uploads it later.
 *
 * Queries are written once, in SQLite's dialect with `?` placeholders; the Postgres side translates
 * (see sql.ts). JSON fields go through `db.json()` because the two spell them differently.
 */
export type DbMode = "remote" | "local" | "none";

export type Value = string | number | null | Uint8Array;
export type Statement = string | { sql: string; args?: Value[] };
export type Row = Record<string, unknown>;

export interface Db {
  engine: Engine;
  execute(stmt: Statement): Promise<{ rows: Row[] }>;
  /** Runs the statements in one transaction. */
  batch(stmts: Statement[]): Promise<void>;
  /** One field of a TEXT column holding JSON, as an SQL expression. */
  json(column: string, key: string, as?: "text" | "number"): string;
}

type Config = { mode: DbMode; engine?: Engine; url?: string; authToken?: string };

function config(): Config {
  const pg = findPostgres(process.env);
  if (pg) return { mode: "remote", engine: "postgres", url: pg.url };
  const found = findDatabase(process.env);
  if (found) {
    return {
      mode: found.url.startsWith("file:") ? "local" : "remote",
      engine: "sqlite",
      url: found.url,
      authToken: found.authToken,
    };
  }
  if (process.env.VERCEL) return { mode: "none" };
  const dir = path.join(process.cwd(), ".data");
  return { mode: "local", engine: "sqlite", url: `file:${path.join(dir, "mather.db")}` };
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
  // Practice help from the AI (hints, why an answer is wrong, the Desmos way), kept so each is
  // asked for once; and small app settings such as the score goal.
  [
    `CREATE TABLE IF NOT EXISTS ai_help (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  ],
];

const VERSION_SQL = `INSERT INTO meta (key, value) VALUES ('schema_version', ?)
  ON CONFLICT (key) DO UPDATE SET value = excluded.value`;

// ---------- SQLite / Turso ----------

async function migrateSqlite(client: Client) {
  await client.execute(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const row = await client.execute(`SELECT value FROM meta WHERE key = 'schema_version'`);
  let version = row.rows.length ? Number(row.rows[0].value) : 0;
  while (version < MIGRATIONS.length) {
    version++;
    await client.batch([...MIGRATIONS[version - 1], { sql: VERSION_SQL, args: [String(version)] }], "write");
  }
}

async function sqliteDb(url: string, remote: boolean, authToken?: string): Promise<Db> {
  let client: Client;
  if (remote) {
    // HTTP client: no native code, works in any serverless runtime.
    const { createClient } = await import("@libsql/client/web");
    client = createClient({ url, authToken });
  } else {
    const file = url.replace(/^file:/, "");
    mkdirSync(path.dirname(file), { recursive: true });
    const { createClient } = await import("@libsql/client");
    client = createClient({ url });
  }
  await migrateSqlite(client);
  return {
    engine: "sqlite",
    execute: async (stmt) => ({ rows: (await client.execute(stmt as InStatement)).rows as unknown as Row[] }),
    batch: async (stmts) => {
      await client.batch(stmts as InStatement[], "write");
    },
    json: (column, key, as) => jsonField("sqlite", column, key, as),
  };
}

// ---------- Postgres / Neon ----------

function pgValue(v: Value) {
  if (v instanceof Uint8Array && !Buffer.isBuffer(v)) return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
  // Every number column is BIGINT (see toPgDdl), and times can carry fractions of a millisecond,
  // which SQLite stores as-is but Postgres rejects.
  if (typeof v === "number" && !Number.isInteger(v)) return Math.round(v);
  return v;
}

function pgQuery(stmt: Statement) {
  const { sql, args = [] } = typeof stmt === "string" ? { sql: stmt } : stmt;
  return { text: toPgPlaceholders(sql), values: args.map(pgValue) };
}

async function inTransaction(pool: Pool, run: (c: PoolClient) => Promise<void>) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await run(c);
    await c.query("COMMIT");
  } catch (err) {
    await c.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    c.release();
  }
}

async function migratePg(pool: Pool) {
  await inTransaction(pool, async (c) => {
    // Several server instances may start at once on a fresh database; one migrates at a time.
    await c.query("SELECT pg_advisory_xact_lock(7413201)");
    await c.query(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
    const row = await c.query(`SELECT value FROM meta WHERE key = 'schema_version'`);
    let version = row.rows.length ? Number(row.rows[0].value) : 0;
    while (version < MIGRATIONS.length) {
      version++;
      for (const sql of MIGRATIONS[version - 1]) await c.query(toPgDdl(sql));
      await c.query(pgQuery({ sql: VERSION_SQL, args: [String(version)] }));
    }
  });
}

async function postgresDb(url: string): Promise<Db> {
  const { Pool, types } = await import("pg");
  // Times are BIGINT and sums/averages NUMERIC; both come back as strings unless parsed.
  const toNumber = (v: string) => Number(v);
  const pool = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    types: {
      getTypeParser: ((oid: number, format?: "text" | "binary") =>
        oid === types.builtins.INT8 || oid === types.builtins.NUMERIC
          ? toNumber
          : types.getTypeParser(oid, format)) as typeof types.getTypeParser,
    },
  });
  // Neon closes idle connections; the pool reconnects, so a dropped idle one isn't fatal.
  pool.on("error", () => {});
  await migratePg(pool);
  return {
    engine: "postgres",
    execute: async (stmt) => ({ rows: (await pool.query(pgQuery(stmt))).rows as Row[] }),
    batch: (stmts) =>
      inTransaction(pool, async (c) => {
        for (const s of stmts) await c.query(pgQuery(s));
      }),
    json: (column, key, as) => jsonField("postgres", column, key, as),
  };
}

// ---------- Connection ----------

async function connect(): Promise<Db | null> {
  const { mode, engine, url, authToken } = config();
  if (mode === "none" || !url) return null;
  return engine === "postgres" ? postgresDb(url) : sqliteDb(url, mode === "remote", authToken);
}

// One connection per server process (kept on globalThis so dev reloads reuse it).
const g = globalThis as unknown as { __matherDb?: Promise<Db | null> };

export function getDb(): Promise<Db | null> {
  if (!g.__matherDb) {
    g.__matherDb = connect().catch((err) => {
      g.__matherDb = undefined;
      throw err;
    });
  }
  return g.__matherDb;
}
