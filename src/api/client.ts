import { API_BASE_URL } from "./config";
import { getToken } from "./token";
import type { ApiErrorBody, ApiErrorCode } from "./types";

const MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION: "The request is invalid.",
  UNAUTHORIZED: "Your token is invalid or expired.",
  NOT_FOUND: "Not found.",
  IDEMPOTENCY_MISMATCH: "This request conflicts with an earlier one. Please start again.",
  RATE_LIMITED: "Too many requests. Please wait a moment.",
  SERVER: "The server had a problem. Please try again.",
  TIMEOUT: "The server took too long to respond.",
  NETWORK: "No connection to the server. Check your internet.",
};

const CODE_BY_STATUS: Record<number, ApiErrorCode> = {
  400: "VALIDATION",
  401: "UNAUTHORIZED",
  404: "NOT_FOUND",
  409: "IDEMPOTENCY_MISMATCH",
  429: "RATE_LIMITED",
  504: "TIMEOUT",
};

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly field?: string,
    readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}

const unauthorizedListeners = new Set<() => void>();
export function onUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken() ?? ""}`,
        ...init.headers,
      },
    });
  } catch (e) {
    if (__DEV__) console.warn(`[api] network error ${path}`, e);
    throw new ApiError("NETWORK", MESSAGES.NETWORK);
  }

  const body: unknown = await res.json().catch(() => null);
  if (res.ok && body !== null) return body as T;

  const err = (body as ApiErrorBody | null)?.error;
  const code: ApiErrorCode = CODE_BY_STATUS[res.status] ?? "SERVER";
  const retryAfterHeader = Number(res.headers.get("Retry-After"));
  const retryAfterMs =
    err?.retryAfterMs ?? (retryAfterHeader > 0 ? retryAfterHeader * 1000 : undefined);
  // Server text is specific for validation; for the rest our copy is clearer.
  const message = code === "VALIDATION" && err?.message ? err.message : MESSAGES[code];

  if (__DEV__) console.warn(`[api] ${res.status} ${path}`, body);
  if (code === "UNAUTHORIZED") unauthorizedListeners.forEach((l) => l());
  throw new ApiError(code, message, err?.field, retryAfterMs);
}

const RETRYABLE: ApiErrorCode[] = ["NETWORK", "SERVER", "TIMEOUT", "RATE_LIMITED"];

/** Outcome is unknown or the request was not processed — safe to resend (POST only with the same Idempotency-Key). */
export function isRetryable(error: unknown): boolean {
  return error instanceof ApiError && RETRYABLE.includes(error.code);
}

export function retryDelay(attemptIndex: number, error: unknown): number {
  if (error instanceof ApiError && error.retryAfterMs) return error.retryAfterMs;
  return 1000 * 2 ** attemptIndex;
}
