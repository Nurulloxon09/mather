// Finding the database settings under the names different setups use.
import assert from "node:assert/strict";
import { findDatabase } from "../src/server/db-env";

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
console.log("db env tests passed");
