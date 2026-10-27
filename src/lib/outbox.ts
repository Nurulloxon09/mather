import { attemptsForSession, type AttemptInput } from "./attempts";
import { listFinished, markSynced, type Session } from "./session";

// Browser-side queue of attempts and finished sessions waiting to be saved to the
// database. Writes go here first, so nothing is lost when the network or database is down;
// flush() sends the queue and removes whatever the server accepted.

const KEY = "mather:outbox";

type Outbox = { attempts: Record<string, AttemptInput>; sessions: Record<string, Session> };

export type FlushResult = "empty" | "sent" | "no-database" | "failed";

function load(): Outbox {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { attempts: {}, sessions: {}, ...JSON.parse(raw) };
  } catch {
    // unreadable: start over
  }
  return { attempts: {}, sessions: {} };
}

function save(o: Outbox) {
  try {
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch {
    // storage full or blocked
  }
}

export function queue({ attempts = [], sessions = [] }: { attempts?: AttemptInput[]; sessions?: Session[] }) {
  const o = load();
  for (const a of attempts) o.attempts[a.id] = a;
  for (const s of sessions) o.sessions[s.id] = s;
  save(o);
}

export function pendingCount() {
  const o = load();
  return Object.keys(o.attempts).length + Object.keys(o.sessions).length;
}

/** Attempts not yet confirmed by the server, including those inside queued sessions. */
export function pendingAttempts(): AttemptInput[] {
  const o = load();
  const byId = new Map(Object.values(o.sessions).flatMap(attemptsForSession).map((a) => [a.id, a]));
  for (const a of Object.values(o.attempts)) if (!byId.has(a.id)) byId.set(a.id, a);
  return [...byId.values()];
}

/** Queue finished sessions from this browser that never reached the database (e.g. from before Phase 2). */
export function queueUnsynced() {
  const o = load();
  const missing = listFinished().filter((s) => !s.syncedAt && !o.sessions[s.id]);
  if (missing.length) queue({ sessions: missing });
}

let inFlight: Promise<FlushResult> | null = null;
let followUp: Promise<FlushResult> | null = null;
let uploads = 0;

/** Increases every time a flush saves something; compare before and after to know if data changed. */
export function uploadCount() {
  return uploads;
}

// Per request, well under the server's limits, so a long backlog goes up in several requests.
const BATCH_ATTEMPTS = 500;
const BATCH_SESSIONS = 50;

async function send(): Promise<FlushResult> {
  let sent = false;
  for (;;) {
    const snapshot = load();
    const attempts = Object.values(snapshot.attempts).slice(0, BATCH_ATTEMPTS);
    const sessions = Object.values(snapshot.sessions).slice(0, BATCH_SESSIONS);
    if (!attempts.length && !sessions.length) return sent ? "sent" : "empty";
    const result = await sendBatch(attempts, sessions);
    if (result !== "sent") return result;
    sent = true;
  }
}

async function sendBatch(attempts: AttemptInput[], sessions: Session[]): Promise<FlushResult> {
  const body = JSON.stringify({ attempts, sessions });
  let res: Response;
  try {
    res = await fetch("/api/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      // Lets a small request finish if the page closes; browsers cap keepalive bodies at 64 KB.
      keepalive: body.length < 60_000,
    });
  } catch {
    return "failed";
  }
  if (res.status === 503) return "no-database";
  if (!res.ok) return "failed";

  // Drop only what was sent unchanged; anything updated meanwhile goes next time.
  const now = load();
  for (const a of attempts) {
    if (JSON.stringify(now.attempts[a.id]) === JSON.stringify(a)) delete now.attempts[a.id];
  }
  for (const s of sessions) {
    if (JSON.stringify(now.sessions[s.id]) === JSON.stringify(s)) delete now.sessions[s.id];
  }
  save(now);
  markSynced(sessions.map((s) => s.id));
  uploads++;
  return "sent";
}

/**
 * Send the queue. One request at a time: a call made while one is running waits for a
 * single follow-up request, which picks up everything queued in the meantime.
 */
export function flush(): Promise<FlushResult> {
  if (!inFlight) {
    inFlight = send().finally(() => {
      inFlight = null;
    });
    return inFlight;
  }
  if (!followUp) {
    followUp = inFlight.then(() => {
      followUp = null;
      return flush();
    });
  }
  return followUp;
}

/** Flush, but give up waiting after `ms` (the request keeps going in the background). */
export function flushWithin(ms: number): Promise<FlushResult | "timeout"> {
  return Promise.race([flush(), new Promise<"timeout">((r) => setTimeout(() => r("timeout"), ms))]);
}
