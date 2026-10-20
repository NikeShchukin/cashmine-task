import { useLocalSearchParams } from "expo-router";

import { ClaimStatusScreen } from "@/features/Claim/screens/ClaimStatus";

export default function ClaimStatusRoute() {
  const { key } = useLocalSearchParams<{ key: string }>();
  return <ClaimStatusScreen claimKey={key} />;
}
