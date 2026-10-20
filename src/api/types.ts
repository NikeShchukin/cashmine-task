export interface BalanceItem {
  asset: string;
  decimals: number;
  available: string;
  pending: string;
  claiming: string;
  usdPrice: string;
}

export interface BalancesResponse {
  asOf: string;
  items: BalanceItem[];
}

export interface Destination {
  id: string;
  label: string;
}

export interface ClaimOptions {
  asset: string;
  minAmount: string;
  fee: string;
  destinations: Destination[];
}

export type ClaimStatus = "pending" | "completed" | "failed";

export interface Claim {
  id: string;
  asset: string;
  amount: string;
  fee: string;
  receiveAmount: string;
  destinationId: string;
  status: ClaimStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClaimBody {
  asset: string;
  amount: string;
  destinationId: string;
}

export type ApiErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "IDEMPOTENCY_MISMATCH"
  | "RATE_LIMITED"
  | "SERVER"
  | "TIMEOUT"
  | "NETWORK";

export interface ApiErrorBody {
  error: { code: string; message: string; field?: string; retryAfterMs?: number };
}
