"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { flush, pendingCount, queueUnsynced, uploadCount } from "@/lib/outbox";

const RETRY_MS = 60_000;
// Runner pages keep their own state; refreshing them would only refetch the same props.
const NO_REFRESH = ["/practice", "/exam"];

/** Uploads queued progress on load, when the browser comes back online, and every minute while anything is waiting. */
export function SyncAgent() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    const run = async () => {
      if (!pendingCount()) return;
      // Counted rather than read from flush()'s result: this call may only wait on a request started elsewhere.
      const before = uploadCount();
      await flush();
      if (alive && uploadCount() !== before && !NO_REFRESH.includes(location.pathname)) router.refresh();
    };
    queueUnsynced();
    void run();
    const timer = setInterval(run, RETRY_MS);
    window.addEventListener("online", run);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("online", run);
    };
  }, [router]);

  return null;
}
