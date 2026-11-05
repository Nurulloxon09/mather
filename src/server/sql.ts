// The app's SQL is written for SQLite (local files and Turso). These turn it into Postgres (Neon)
// where the two differ; everything else (ON CONFLICT upserts, subqueries, LIMIT) is shared.

export type Engine = "sqlite" | "postgres";

/** `?` placeholders become `$1, $2, …`, skipping anything inside quoted strings. */
export function toPgPlaceholders(sql: string): string {
  let out = "";
  let n = 0;
  let quote: string | null = null;
  for (const ch of sql) {
    if (quote) {
      if (ch === quote) quote = null;
      out += ch;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      out += ch;
    } else if (ch === "?") {
      out += `$${++n}`;
    } else {
      out += ch;
    }
  }
  return out;
}

/** Table definitions: times are milliseconds (too big for a Postgres INTEGER), and BLOB is BYTEA. */
export function toPgDdl(sql: string): string {
  return sql.replace(/\bINTEGER\b/g, "BIGINT").replace(/\bBLOB\b/g, "BYTEA");
}

/** One field of a TEXT column that holds JSON, as an SQL expression. */
export function jsonField(engine: Engine, column: string, key: string, as: "text" | "number" = "text"): string {
  if (!/^[a-z_.]+$/i.test(column) || !/^[a-z_]+$/i.test(key)) throw new Error("bad json field");
  if (engine === "sqlite") return `json_extract(${column}, '$.${key}')`;
  const text = `((${column})::jsonb ->> '${key}')`;
  return as === "number" ? `(${text})::numeric` : text;
}
