import { useSyncExternalStore } from "react";

import type { Claim, CreateClaimBody } from "@/api/types";
import type { OverlayClaim } from "@/utils/amount";

import type { PolledClaim } from "./useClaimPolling";

/** A claim we submitted. `claim` is null while the POST outcome is unknown. */
export interface TrackedClaim {
  key: string;
  body: CreateClaimBody;
  claim: Claim | null;
  /** Device time of the last submit attempt; starts the claim's polling window. */
  trackedAt: number;
}

const STORAGE_KEY = "cashmine.trackedClaims";
const listeners = new Set<() => void>();
let entries: TrackedClaim[] = load();

function load(): TrackedClaim[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TrackedClaim[];
  } catch (e) {
    if (__DEV__) console.warn("[trackedClaims] unreadable storage, resetting", e);
    return [];
  }
}

function save(next: TrackedClaim[]) {
  entries = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function upsertTracked(entry: TrackedClaim) {
  const rest = entries.filter((e) => e.key !== entry.key);
  save([entry, ...rest]);
}

export function updateTrackedClaim(claim: Claim) {
  save(entries.map((e) => (e.claim?.id === claim.id ? { ...e, claim } : e)));
}

export function removeTracked(key: string) {
  save(entries.filter((e) => e.key !== key));
}

export function clearTracked() {
  save([]);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTrackedClaims(): TrackedClaim[] {
  return useSyncExternalStore(subscribe, () => entries);
}

export function polled(list: TrackedClaim[]): PolledClaim[] {
  return list.flatMap((e) => (e.claim ? [{ claim: e.claim, trackedAt: e.trackedAt }] : []));
}

export function toOverlay(e: TrackedClaim): OverlayClaim {
  return {
    asset: e.body.asset,
    amount: e.body.amount,
    createdAt: e.claim?.createdAt ?? null,
    status: e.claim?.status ?? "unknown",
  };
}
