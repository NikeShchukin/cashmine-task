import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import { getToken, setToken } from "@/api/token";
import { clearTracked } from "@/features/Claim/trackedClaims";

export function useTokenScreen() {
  const { expired } = useLocalSearchParams<{ expired?: string }>();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(() => getToken() ?? "");
  const trimmed = value.trim();

  const save = () => {
    if (trimmed !== getToken()) {
      // Data is private per token: drop everything belonging to the previous one.
      queryClient.clear();
      clearTracked();
    } else {
      queryClient.resetQueries();
    }
    setToken(trimmed);
    router.replace("/");
  };

  return {
    value,
    setValue,
    canSave: trimmed.length > 0,
    save,
    expiredMessage: expired ? "Your token is invalid or expired. Enter a valid one." : null,
  };
}
