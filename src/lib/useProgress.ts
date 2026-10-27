"use client";

import { useEffect, useMemo, useState } from "react";
import { addAttempts, grade, type Attempt, type ProgressMap } from "./attempts";
import { pendingAttempts, queueUnsynced } from "./outbox";
import type { Question } from "./types";

/**
 * Progress from the database plus attempts still waiting in this browser's outbox,
 * so a just-finished set (or everything, when no database is connected) shows up right away.
 */
export function useProgress(server: ProgressMap | null, byId: Map<string, Question>): ProgressMap {
  const [local, setLocal] = useState<Attempt[]>([]);
  useEffect(() => {
    queueUnsynced();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the outbox from localStorage after mount
    setLocal(
      pendingAttempts().flatMap((a) => {
        const q = byId.get(a.questionId);
        return q ? [grade(a, q)] : [];
      }),
    );
  }, [byId, server]);
  return useMemo(() => addAttempts(server ?? {}, local), [server, local]);
}
