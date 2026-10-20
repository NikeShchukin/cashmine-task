import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

import { balancesKey, fetchBalances } from "@/api/balances";
import { polled, removeTracked, toOverlay, useTrackedClaims } from "@/features/Claim/trackedClaims";
import { useClaimPolling } from "@/features/Claim/useClaimPolling";
import { effectiveBalances, type OverlayClaim, totals } from "@/utils/amount";

const SNAPSHOT_MS = 15_000;

export function useHome() {
  const query = useQuery({
    queryKey: balancesKey,
    queryFn: fetchBalances,
    refetchInterval: SNAPSHOT_MS,
  });
  const tracked = useTrackedClaims();
  useClaimPolling(polled(tracked));

  const snapshot = query.data;
  const items = snapshot ? effectiveBalances(snapshot, tracked.map(toOverlay)) : [];
  const asOf = snapshot ? Date.parse(snapshot.asOf) : 0;

  const banner = tracked.map((t) => {
    const status: OverlayClaim["status"] = t.claim?.status ?? "unknown";
    // Dismissing must not change balances: only once the snapshot no longer needs the overlay.
    const dismissible =
      status === "failed" ||
      (status === "completed" && t.claim !== null && asOf > Date.parse(t.claim.createdAt));
    return {
      key: t.key,
      asset: t.body.asset,
      amount: t.body.amount,
      status,
      dismissible,
      open: () => router.push({ pathname: "/claim-status/[key]", params: { key: t.key } }),
      dismiss: () => removeTracked(t.key),
    };
  });

  return {
    isLoading: query.isPending,
    error: query.error,
    hasData: !!snapshot,
    isRefreshing: query.isRefetching,
    refresh: () => {
      query.refetch();
    },
    asOf: snapshot?.asOf ?? null,
    items,
    totals: totals(items),
    banner,
    openClaim: (asset: string) => router.push({ pathname: "/claim/[asset]", params: { asset } }),
    openActivity: () => router.push("/activity"),
    changeToken: () => router.push("/token"),
  };
}
