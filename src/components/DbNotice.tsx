import type { DbStatus } from "@/server/db";
import { PAGE } from "./AppHeader";

const list = (names: string[]) => names.map((n, i) => (
  <span key={n}>
    {i > 0 && ", "}
    <code>{n}</code>
  </span>
));

/** Note shown when progress can't reach the database, saying what to fix. */
export function DbNotice({ status, error }: { status: DbStatus; error?: boolean }) {
  if (status.mode !== "none" && !error) return null;
  const hint = status.hint;
  return (
    <div className={PAGE}>
      <p className="rounded-lg bg-bb-amber-soft px-4 py-2.5 text-sm">
        {status.mode !== "none" ? (
          <>
            <strong>Couldn&apos;t reach the database.</strong> Showing what this browser has saved; it will sync
            when the database is back.
          </>
        ) : hint?.kind === "unreadable" ? (
          <>
            <strong>Database settings found, but no address.</strong> This deployment has {list(hint.names)}, but none
            of them holds the database address (it starts with <code>libsql://</code>). In Vercel → Settings →
            Environment Variables, add it as <code>TURSO_DATABASE_URL</code>, then redeploy.
          </>
        ) : hint?.kind === "other" ? (
          <>
            <strong>A different kind of database is connected</strong> ({list(hint.names)}). This app uses Postgres
            (Neon) or Turso. In Vercel, open this project → Storage → add one of those (both are free) and connect
            it, then redeploy.
          </>
        ) : hint?.kind === "preview" ? (
          <>
            <strong>No database on this preview deployment.</strong> Database settings only reach the environments
            they&apos;re turned on for. In Vercel → Settings → Environment Variables, turn on <em>Preview</em> for
            the database settings, then redeploy.
          </>
        ) : (
          <>
            <strong>No database connected.</strong> Progress is kept in this browser for now and uploads
            automatically once one is added. To add one: in Vercel, open this project → Storage → connect a
            Neon (Postgres) or Turso database (both free), then redeploy.
          </>
        )}
      </p>
    </div>
  );
}
