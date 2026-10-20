import { apiFetch } from "./client";
import type { BalancesResponse } from "./types";

export const balancesKey = ["balances"] as const;

export function fetchBalances() {
  return apiFetch<BalancesResponse>("/v1/balances");
}
