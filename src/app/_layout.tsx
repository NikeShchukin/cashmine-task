import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useEffect } from "react";

import { isRetryable, onUnauthorized, retryDelay } from "@/api/client";
import { useToken } from "@/api/token";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => failureCount < 3 && isRetryable(error),
      retryDelay,
    },
  },
});

export default function RootLayout() {
  const token = useToken();

  useEffect(
    () => onUnauthorized(() => router.navigate({ pathname: "/token", params: { expired: "1" } })),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Protected guard={!!token}>
          <Stack.Screen name="index" options={{ title: "Payback" }} />
          <Stack.Screen name="claim/[asset]" options={{ title: "Claim" }} />
          <Stack.Screen name="claim-status/[key]" options={{ title: "Claim status" }} />
          <Stack.Screen name="activity" options={{ title: "Activity" }} />
        </Stack.Protected>
        <Stack.Screen name="token" options={{ title: "API token" }} />
      </Stack>
    </QueryClientProvider>
  );
}
