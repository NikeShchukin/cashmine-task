import { router } from "expo-router";

import { polled, useTrackedClaims } from "@/features/Claim/trackedClaims";
import { useClaimPolling } from "@/features/Claim/useClaimPolling";
import { useSubmitClaim } from "@/features/Claim/useSubmitClaim";

export function useClaimStatus(key: string) {
  const entry = useTrackedClaims().find((t) => t.key === key) ?? null;
  const check = useSubmitClaim();
  const [polledEntry] = polled(entry ? [entry] : []);
  const polling = useClaimPolling(polledEntry ? [polledEntry] : []);
  const claim = entry?.claim ?? null;
  const pollError = polling.queries[0]?.error ?? null;

  return {
    entry,
    claim,
    // Not tracked any more: either a "Check" proved it was never created, or it was dismissed.
    rejectedMessage: !entry && check.error ? check.error.message : null,
    isChecking: check.isPending,
    check: () => entry && check.mutate({ key: entry.key, body: entry.body }),
    timedOut: polledEntry ? polling.timedOut(polledEntry) : false,
    pollError: pollError?.message ?? null,
    refresh: polling.restart,
    goHome: () => router.replace("/"),
  };
}
