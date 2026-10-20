import { apiFetch } from "./client";
import type { ActivityPage } from "./types";

export const PAGE_SIZE = 20;

export function fetchActivity(cursor: string | null) {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<ActivityPage>(`/v1/activity?${params}`);
}
