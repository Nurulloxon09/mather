import type { DbMode } from "@/server/db";

/** Banner shown when progress can't reach the database. */
export function DbNotice({ mode, error }: { mode: DbMode; error?: boolean }) {
  if (mode !== "none" && !error) return null;
  return (
    <div className="border-b border-[#e6b800] bg-[#fff8d6]">
      <p className="mx-auto max-w-6xl px-6 py-2.5 text-sm">
        {mode === "none" ? (
          <>
            <strong>No database connected.</strong> Your progress is kept in this browser and uploads
            automatically once you add one (README → Database).
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
