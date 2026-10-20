import Big from "big.js";

import type { BalanceItem, BalancesResponse } from "@/api/types";

// API grammar: digits, optional dot + digits, no leading zeros.
const AMOUNT_RE = /^(0|[1-9]\d*)(\.\d+)?$/;

export type ParseResult = { ok: true; value: string } | { ok: false; error: string };

export function parseAmount(input: string): ParseResult {
  const value = input.trim().replace(",", ".");
  if (value === "") return { ok: false, error: "Enter an amount" };
  if (!AMOUNT_RE.test(value)) return { ok: false, error: "Enter a number like 0.5 or 12" };
  return { ok: true, value };
}

function decimalPlaces(value: string): number {
  const dot = value.indexOf(".");
  return dot === -1 ? 0 : value.length - dot - 1;
}

export interface ClaimRules {
  decimals: number;
  minAmount: string;
  available: string;
  fee: string;
}

export type ValidationResult =
  | { ok: true; amount: string; receive: string }
  | { ok: false; error: string };

export function validateClaimAmount(input: string, rules: ClaimRules): ValidationResult {
  const parsed = parseAmount(input);
  if (!parsed.ok) return parsed;
  const { value } = parsed;
  if (decimalPlaces(value) > rules.decimals) {
    return { ok: false, error: `At most ${rules.decimals} decimal places` };
  }
  const amount = new Big(value);
  if (amount.lt(rules.minAmount)) {
    return { ok: false, error: `Minimum is ${formatAmount(rules.minAmount)}` };
  }
  if (amount.gt(rules.available)) {
    return { ok: false, error: `Maximum is ${formatAmount(rules.available)}` };
  }
  const receive = amount.minus(rules.fee);
  if (receive.lte(0)) return { ok: false, error: "Amount must be greater than the fee" };
  return { ok: true, amount: value, receive: receive.toFixed() };
}

/** Plain decimal, no exponent, trailing zeros trimmed, never rounded. */
export function formatAmount(value: string | Big): string {
  return new Big(value).toFixed();
}

export function formatUsd(value: Big): string {
  return `$${value.round(2, Big.roundHalfUp).toFixed(2)}`;
}

export function usdValue(amount: string, usdPrice: string): Big {
  return new Big(amount).times(usdPrice);
}

export interface Totals {
  claimableUsd: Big;
  totalUsd: Big;
}

export function totals(items: BalanceItem[]): Totals {
  return items.reduce<Totals>(
    (acc, i) => ({
      claimableUsd: acc.claimableUsd.plus(usdValue(i.available, i.usdPrice)),
      totalUsd: acc.totalUsd.plus(
        new Big(i.available).plus(i.pending).plus(i.claiming).times(i.usdPrice),
      ),
    }),
    { claimableUsd: new Big(0), totalUsd: new Big(0) },
  );
}

export interface OverlayClaim {
  asset: string;
  amount: string;
  /** Server createdAt; null while the outcome of the POST is unknown. */
  createdAt: string | null;
  status: "pending" | "completed" | "failed" | "unknown";
}

/**
 * The snapshot lags up to 15 s behind a new claim. Until a snapshot taken after the
 * claim's createdAt arrives, move the amount from available to claiming ourselves.
 */
export function effectiveBalances(
  snapshot: BalancesResponse,
  claims: OverlayClaim[],
): BalanceItem[] {
  const asOf = Date.parse(snapshot.asOf);
  return snapshot.items.map((item) => {
    const inFlight = claims.filter(
      (c) =>
        c.asset === item.asset &&
        c.createdAt !== null &&
        c.status !== "failed" &&
        asOf <= Date.parse(c.createdAt),
    );
    if (inFlight.length === 0) return item;
    const sum = inFlight.reduce((acc, c) => acc.plus(c.amount), new Big(0));
    return {
      ...item,
      available: new Big(item.available).minus(sum).toFixed(),
      claiming: new Big(item.claiming).plus(sum).toFixed(),
    };
  });
}
