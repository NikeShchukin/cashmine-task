import Big from "big.js";

import type { BalancesResponse } from "@/api/types";

import {
  effectiveBalances,
  formatAmount,
  formatUsd,
  parseAmount,
  totals,
  validateClaimAmount,
} from "./amount";

describe("parseAmount", () => {
  it.each(["0", "0.5", "12", "820.413207", "0.10"])("accepts %s", (v) => {
    expect(parseAmount(v)).toEqual({ ok: true, value: v });
  });

  it("trims and converts comma to dot", () => {
    expect(parseAmount(" 0,5 ")).toEqual({ ok: true, value: "0.5" });
  });

  it.each(["", "  ", ".5", "1.", "05", "00.5", "1e-3", "-1", "1.2.3", "abc", "1,2,3"])(
    "rejects %p",
    (v) => {
      expect(parseAmount(v).ok).toBe(false);
    },
  );
});

describe("validateClaimAmount", () => {
  const rules = { decimals: 4, minAmount: "0.01", available: "1.5", fee: "0.0012" };
  const error = (input: string, r = rules) => {
    const res = validateClaimAmount(input, r);
    return res.ok ? null : res.error;
  };

  it("accepts boundaries min and available", () => {
    expect(validateClaimAmount("0.01", rules)).toEqual({ ok: true, amount: "0.01", receive: "0.0088" });
    expect(validateClaimAmount("1.5", rules)).toEqual({ ok: true, amount: "1.5", receive: "1.4988" });
  });

  it("rejects bad format", () => expect(error(".5")).toMatch(/number/));
  it("rejects too many decimals", () => expect(error("0.12345")).toMatch(/4 decimal/));
  it("rejects below min", () => expect(error("0.0099")).toMatch(/Minimum is 0.01/));
  it("rejects above available", () => expect(error("1.5001")).toMatch(/Maximum is 1.5/));
  it("rejects amount not covering fee", () => {
    expect(error("0.0012", { ...rules, minAmount: "0" })).toMatch(/fee/);
  });
});

describe("fee and formatting", () => {
  it("computes receive exactly", () => {
    const res = validateClaimAmount("0.5", { decimals: 18, minAmount: "0.01", available: "1", fee: "0.0012" });
    expect(res).toEqual({ ok: true, amount: "0.5", receive: "0.4988" });
  });

  it("has no float drift", () => {
    expect(formatAmount(new Big("0.1").plus("0.2"))).toBe("0.3");
  });

  it("never uses exponent notation and trims zeros", () => {
    expect(formatAmount("0.0000001")).toBe("0.0000001");
    expect(formatAmount("1.500000")).toBe("1.5");
    expect(formatAmount("123456789012345678901234")).toBe("123456789012345678901234");
  });

  it("rounds USD half-up to cents", () => {
    expect(formatUsd(new Big("1.005"))).toBe("$1.01");
    expect(formatUsd(new Big("1.004"))).toBe("$1.00");
  });
});

const snapshot: BalancesResponse = {
  asOf: "2026-10-20T10:00:00.000Z",
  items: [
    { asset: "USDT", decimals: 6, available: "820.413207", pending: "50.12", claiming: "0", usdPrice: "1.0002" },
    { asset: "ETH", decimals: 18, available: "1.5", pending: "0", claiming: "0.1", usdPrice: "2000" },
  ],
};

describe("totals", () => {
  it("sums claimable and total USD", () => {
    const t = totals(snapshot.items);
    // 820.413207 * 1.0002 + 1.5 * 2000
    expect(t.claimableUsd.toFixed()).toBe("3820.5772896414");
    // (870.533207) * 1.0002 + 1.6 * 2000
    expect(t.totalUsd.toFixed()).toBe("4070.7073136414");
    expect(formatUsd(t.totalUsd)).toBe("$4070.71");
  });
});

describe("effectiveBalances", () => {
  const eth = (items: ReturnType<typeof effectiveBalances>) => items.find((i) => i.asset === "ETH")!;

  it("moves amount of a claim newer than the snapshot from available to claiming", () => {
    const res = effectiveBalances(snapshot, [
      { asset: "ETH", amount: "0.5", createdAt: "2026-10-20T10:00:05.000Z", status: "pending" },
      { asset: "ETH", amount: "0.25", createdAt: "2026-10-20T10:00:06.000Z", status: "completed" },
    ]);
    expect(eth(res)).toMatchObject({ available: "0.75", claiming: "0.85" });
    expect(res.find((i) => i.asset === "USDT")).toBe(snapshot.items[0]);
  });

  it("drops the overlay once the snapshot is newer than the claim", () => {
    const res = effectiveBalances(snapshot, [
      { asset: "ETH", amount: "0.5", createdAt: "2026-10-20T09:59:59.000Z", status: "pending" },
    ]);
    expect(eth(res)).toMatchObject({ available: "1.5", claiming: "0.1" });
  });

  it("ignores failed and unknown claims", () => {
    const res = effectiveBalances(snapshot, [
      { asset: "ETH", amount: "0.5", createdAt: "2026-10-20T10:00:05.000Z", status: "failed" },
      { asset: "ETH", amount: "0.5", createdAt: null, status: "unknown" },
    ]);
    expect(eth(res)).toMatchObject({ available: "1.5", claiming: "0.1" });
  });
});
