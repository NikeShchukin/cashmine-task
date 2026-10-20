import { useSyncExternalStore } from "react";

const KEY = "cashmine.token";
const listeners = new Set<() => void>();

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function setToken(token: string) {
  localStorage.setItem(KEY, token);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToken() {
  return useSyncExternalStore(subscribe, getToken);
}
