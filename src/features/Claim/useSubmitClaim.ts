import { useMutation } from "@tanstack/react-query";

import { createClaim } from "@/api/claims";
import { isRetryable, retryDelay } from "@/api/client";
import type { Claim, CreateClaimBody } from "@/api/types";

import { removeTracked, upsertTracked } from "./trackedClaims";

export interface SubmitVars {
  key: string;
  body: CreateClaimBody;
}

const MAX_ATTEMPTS = 3;

/**
 * POST /v1/claims with one Idempotency-Key per body. Retries resend the same key, so the
 * server returns the original claim instead of creating a second one.
 */
export function useSubmitClaim() {
  return useMutation<Claim, Error, SubmitVars>({
    mutationFn: ({ key, body }: SubmitVars) => createClaim(key, body),
    retry: (failureCount, error) => failureCount < MAX_ATTEMPTS - 1 && isRetryable(error),
    retryDelay,
    // Persist before sending: if the page dies mid-request, the entry stays "unknown" with its key.
    onMutate: ({ key, body }) => upsertTracked({ key, body, claim: null, trackedAt: Date.now() }),
    onSuccess: (claim, { key, body }) => upsertTracked({ key, body, claim, trackedAt: Date.now() }),
    onError: (error, { key }) => {
      // Retryable errors leave the outcome unknown: keep the entry so the user can check with the same key.
      if (!isRetryable(error)) removeTracked(key);
    },
  });
}
