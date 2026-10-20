import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";

import { balancesKey, fetchBalances } from "@/api/balances";
import { fetchClaimOptions } from "@/api/claims";
import { isRetryable } from "@/api/client";
import { toOverlay, useTrackedClaims } from "@/features/Claim/trackedClaims";
import { useSubmitClaim } from "@/features/Claim/useSubmitClaim";
import { effectiveBalances, validateClaimAmount } from "@/utils/amount";

export function useClaimForm(asset: string) {
  const balances = useQuery({ queryKey: balancesKey, queryFn: fetchBalances });
  const options = useQuery({ queryKey: ["claim-options", asset], queryFn: () => fetchClaimOptions(asset) });
  const tracked = useTrackedClaims();
  const submit = useSubmitClaim();

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [pickedDestination, setPickedDestination] = useState<string | null>(null);
  // One key per confirmed body: a double tap on Confirm resends the same key, not a new claim.
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const item =
    balances.data && effectiveBalances(balances.data, tracked.map(toOverlay)).find((i) => i.asset === asset);
  // Our own in-flight submit is also stored with claim === null; it's not "unknown" yet.
  const unknownClaim = tracked.find(
    (t) => t.body.asset === asset && t.claim === null && t.key !== submit.variables?.key,
  );
  const destinations = options.data?.destinations ?? [];
  const destinationId = pickedDestination ?? destinations[0]?.id ?? null;

  const validation =
    item && options.data
      ? validateClaimAmount(amount, {
          decimals: item.decimals,
          minAmount: options.data.minAmount,
          available: item.available,
          fee: options.data.fee,
        })
      : null;
  const showError = amount !== "" && validation && !validation.ok;

  const confirm = () => {
    if (!validation?.ok || !destinationId || !confirmKey) return;
    const key = confirmKey;
    submit.mutate(
      { key, body: { asset, amount: validation.amount, destinationId } },
      {
        onSuccess: () => router.replace({ pathname: "/claim-status/[key]", params: { key } }),
        onError: (error) => {
          // Outcome unknown after all retries → status screen offers "Check" with the same key.
          if (isRetryable(error)) router.replace({ pathname: "/claim-status/[key]", params: { key } });
          else setStep("form");
        },
      },
    );
  };

  return {
    isLoading: balances.isPending || options.isPending,
    loadError: balances.error ?? options.error,
    retryLoad: () => {
      balances.refetch();
      options.refetch();
    },
    notFound: balances.isSuccess && !item,
    unknownClaimKey: unknownClaim?.key ?? null,
    openUnknown: () =>
      unknownClaim && router.push({ pathname: "/claim-status/[key]", params: { key: unknownClaim.key } }),
    item,
    options: options.data,
    destinations,
    destinationId,
    setDestination: setPickedDestination,
    amount,
    setAmount: (v: string) => {
      submit.reset();
      setAmount(v);
    },
    setMax: () => {
      if (!item) return;
      submit.reset();
      setAmount(item.available);
    },
    validationError: showError && !validation.ok ? validation.error : null,
    validAmount: validation?.ok ? validation.amount : null,
    receive: validation?.ok ? validation.receive : null,
    canContinue: !!validation?.ok && !!destinationId,
    step,
    goConfirm: () => {
      setConfirmKey(crypto.randomUUID());
      setStep("confirm");
    },
    back: () => setStep("form"),
    confirm,
    isSubmitting: submit.isPending,
    submitError: submit.error && !isRetryable(submit.error) ? submit.error.message : null,
  };
}
