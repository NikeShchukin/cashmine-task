import { useLocalSearchParams } from "expo-router";

import { ClaimFormScreen } from "@/features/Claim/screens/ClaimForm";

export default function ClaimRoute() {
  const { asset } = useLocalSearchParams<{ asset: string }>();
  return <ClaimFormScreen asset={asset} />;
}
