import { useQueries } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { fetchClaim } from "@/api/claims";
import type { Claim } from "@/api/types";

import { updateTrackedClaim } from "./trackedClaims";

const POLL_MS = 2000;
const POLL_WINDOW_MS = 60_000;

export const claimKey = (id: string) => ["claim", id] as const;

export interface PolledClaim {
  claim: Claim;
  /** Device time the claim was created/tracked; each claim gets its own 60 s window. */
  trackedAt: number;
}

/** Polls each pending claim every 2 s for at most 60 s from its trackedAt (or the last `restart`). */
export function useClaimPolling(entries: PolledClaim[]) {
  const [restartedAt, setRestartedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const windowOpen = (e: PolledClaim, at: number) =>
    at - Math.max(e.trackedAt, restartedAt) < POLL_WINDOW_MS;

  // Re-render every second while something is pending, so "timed out" shows without a new poll.
  const hasPending = entries.some((e) => e.claim.status === "pending");
  useEffect(() => {
    if (!hasPending) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasPending]);

  const queries = useQueries({
    queries: entries.map((e) => ({
      queryKey: claimKey(e.claim.id),
      queryFn: async () => {
        const fresh = await fetchClaim(e.claim.id);
        updateTrackedClaim(fresh);
        return fresh;
      },
      initialData: e.claim,
      initialDataUpdatedAt: 0,
      enabled: e.claim.status === "pending",
      refetchInterval: (q: { state: { data?: Claim } }) =>
        q.state.data?.status === "pending" && windowOpen(e, Date.now()) ? POLL_MS : false,
    })),
  });

  return {
    queries,
    timedOut: (e: PolledClaim) => e.claim.status === "pending" && !windowOpen(e, now),
    restart: () => {
      setRestartedAt(Date.now());
      setNow(Date.now());
      queries.forEach((q) => q.refetch());
    },
  };
}
