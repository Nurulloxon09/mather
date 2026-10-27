"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** True once hydrated; lets pages show browser-local values without a hydration mismatch. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** A timestamp in the viewer's time zone (blank during server render). */
export function LocalDate({ ms, dateOnly }: { ms: number; dateOnly?: boolean }) {
  const hydrated = useHydrated();
  if (!hydrated) return <time>&nbsp;</time>;
  const d = new Date(ms);
  return (
    <time dateTime={d.toISOString()}>
      {dateOnly
        ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
        : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
    </time>
  );
}
