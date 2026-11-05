// Finding the database settings under the names different setups use.
import assert from "node:assert/strict";
import { diagnose, findDatabase, findPostgres } from "../src/server/db-env";
import { jsonField, toPgDdl, toPgPlaceholders } from "../src/server/sql";

const URL = "libsql://mather-me.aws-eu-west-1.turso.io";
const cases: [string, Record<string, string>, string | undefined][] = [
  ["Turso docs names", { TURSO_DATABASE_URL: URL, TURSO_AUTH_TOKEN: "t1" }, "t1"],
  ["Vercel prefix", { STORAGE_TURSO_DATABASE_URL: URL, STORAGE_TURSO_AUTH_TOKEN: "t2" }, "t2"],
  ["short names", { TURSO_URL: URL, TURSO_TOKEN: "t3" }, "t3"],
  ["generic", { DATABASE_URL: URL, DATABASE_AUTH_TOKEN: "t4" }, "t4"],
  ["custom prefix", { MATHER_DB_URL: URL, MATHER_DB_AUTH_TOKEN: "t5" }, "t5"],
  ["token elsewhere", { DB: URL, TURSO_AUTH_TOKEN: "t6" }, "t6"],
];
for (const [name, env, token] of cases) {
  const found = findDatabase({ PATH: "/usr/bin", VERCEL: "1", ...env });
  assert.ok(found, name);
  assert.equal(found.url, URL, name);
  assert.equal(found.authToken, token, name);
}
assert.equal(findDatabase({ VERCEL: "1", PATH: "/usr/bin" }), null, "nothing set");
assert.equal(findDatabase({ NEXT_PUBLIC_DB: URL }), null, "browser-exposed variables are ignored");
assert.equal(findDatabase({ TURSO_DATABASE_URL: "file:/tmp/x.db" })?.url, "file:/tmp/x.db", "explicit file URL");

// Turso's https:// addresses work too.
assert.equal(findDatabase({ TURSO_URL: "https://mather-me.turso.io", TURSO_TOKEN: "t" })?.url, "https://mather-me.turso.io");
assert.equal(findDatabase({ DB_URL: "https://mather-me.aws-eu-west-1.turso.io" })?.url, "https://mather-me.aws-eu-west-1.turso.io");
assert.equal(findDatabase({ DATABASE_URL: "postgres://u:p@host/db" }), null, "postgres is not libSQL");

// Why nothing was found.
assert.deepEqual(diagnose({ VERCEL: "1", TURSO_AUTH_TOKEN: "t" }), { kind: "unreadable", names: ["TURSO_AUTH_TOKEN"] });
assert.deepEqual(diagnose({ VERCEL: "1", KV_URL: "rediss://x", REDIS_URL: "rediss://x" }), {
  kind: "other",
  names: ["KV_URL", "REDIS_URL"],
});
assert.deepEqual(diagnose({ VERCEL: "1", VERCEL_ENV: "preview" }), { kind: "preview" });
assert.deepEqual(diagnose({ VERCEL: "1", VERCEL_ENV: "production" }), { kind: "missing" });
assert.deepEqual(diagnose({ NEXT_PUBLIC_TURSO_URL: "x", VERCEL_ENV: "production" }), { kind: "missing" }, "browser-exposed names ignored");

// Neon / Postgres: the pooled DATABASE_URL first, whatever else the integration adds.
const PG = "postgresql://user:pw@ep-cool-name-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";
const neon = {
  DATABASE_URL: PG,
  DATABASE_URL_UNPOOLED: PG.replace("-pooler", ""),
  POSTGRES_URL: PG,
  POSTGRES_URL_NON_POOLING: PG.replace("-pooler", ""),
  POSTGRES_PRISMA_URL: PG,
  PGHOST: "ep-cool-name-pooler.us-east-2.aws.neon.tech",
};
assert.equal(findPostgres(neon)?.urlKey, "DATABASE_URL");
assert.equal(findPostgres({ POSTGRES_URL_NON_POOLING: "postgres://a", POSTGRES_URL: "postgres://b" })?.url, "postgres://b");
assert.equal(findPostgres({ STORAGE_DATABASE_URL_UNPOOLED: "postgres://a", STORAGE_DATABASE_URL: "postgres://b" })?.urlKey, "STORAGE_DATABASE_URL");
assert.equal(findPostgres({ DATABASE_URL_UNPOOLED: "postgres://a" })?.urlKey, "DATABASE_URL_UNPOOLED", "unpooled as a last resort");
assert.equal(findPostgres({ DATABASE_URL: URL }), null, "libsql is not Postgres");
assert.equal(findPostgres({ NEXT_PUBLIC_DB: PG }), null, "browser-exposed variables are ignored");
assert.equal(findPostgres({ PATH: "/usr/bin" }), null);

// SQL translation for Postgres.
assert.equal(toPgPlaceholders("SELECT * FROM t WHERE a = ? AND b IN (?, ?)"), "SELECT * FROM t WHERE a = $1 AND b IN ($2, $3)");
assert.equal(toPgPlaceholders("SELECT '?' AS q, x FROM t WHERE y = ?"), "SELECT '?' AS q, x FROM t WHERE y = $1");
assert.equal(toPgDdl("created_at INTEGER NOT NULL, data BLOB NOT NULL"), "created_at BIGINT NOT NULL, data BYTEA NOT NULL");
assert.equal(jsonField("sqlite", "s.data", "custom"), "json_extract(s.data, '$.custom')");
assert.equal(jsonField("postgres", "s.data", "custom"), "((s.data)::jsonb ->> 'custom')");
assert.equal(jsonField("postgres", "data", "page", "number"), "(((data)::jsonb ->> 'page'))::numeric");
assert.throws(() => jsonField("postgres", "data; drop", "page"));
console.log("db env tests passed");
