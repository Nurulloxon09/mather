// Finding the database settings under the names different setups use.
import assert from "node:assert/strict";
import { diagnose, findDatabase } from "../src/server/db-env";

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
assert.deepEqual(diagnose({ VERCEL: "1", DATABASE_URL: "postgres://x", POSTGRES_URL: "postgres://x" }), {
  kind: "other",
  names: ["DATABASE_URL", "POSTGRES_URL"],
});
assert.deepEqual(diagnose({ VERCEL: "1", VERCEL_ENV: "preview" }), { kind: "preview" });
assert.deepEqual(diagnose({ VERCEL: "1", VERCEL_ENV: "production" }), { kind: "missing" });
assert.deepEqual(diagnose({ NEXT_PUBLIC_TURSO_URL: "x", VERCEL_ENV: "production" }), { kind: "missing" }, "browser-exposed names ignored");
console.log("db env tests passed");
