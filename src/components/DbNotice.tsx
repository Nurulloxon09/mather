import type { DbMode } from "@/server/db";
import { PAGE } from "./AppHeader";

/** Note shown when progress can't reach the database. */
export function DbNotice({ mode, error }: { mode: DbMode; error?: boolean }) {
  if (mode !== "none" && !error) return null;
  return (
    <div className={PAGE}>
      <p className="rounded-lg bg-bb-amber-soft px-4 py-2.5 text-sm">
        {mode === "none" ? (
          <>
            <strong>No database connected.</strong> Progress is kept in this browser for now and uploads
            automatically once one is added. To add one: in Vercel, open this project → Storage → connect a
            Turso database (free), then redeploy.
          </>
        ) : (
          <>
            <strong>Couldn&apos;t reach the database.</strong> Showing what this browser has saved; it will sync
            when the database is back.
          </>
        )}
      </p>
    </div>
  );
}
