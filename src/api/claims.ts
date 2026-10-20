import { apiFetch } from "./client";
import type { Claim, ClaimOptions, CreateClaimBody } from "./types";

export function fetchClaimOptions(asset: string) {
  return apiFetch<ClaimOptions>(`/v1/claim-options?asset=${encodeURIComponent(asset)}`);
}

export function createClaim(idempotencyKey: string, body: CreateClaimBody) {
  return apiFetch<Claim>("/v1/claims", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(body),
  });
}

export function fetchClaim(id: string) {
  return apiFetch<Claim>(`/v1/claims/${encodeURIComponent(id)}`);
}
