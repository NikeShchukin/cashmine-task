import type { Big } from "big.js";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "@/theme";
import { formatUsd } from "@/utils/amount";

interface Props {
  claimableUsd: Big;
  totalUsd: Big;
  asOf: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function useSecondsSince(iso: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
}

export function TotalsHeader({ claimableUsd, totalUsd, asOf, isRefreshing, onRefresh }: Props) {
  const seconds = useSecondsSince(asOf);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Available to claim</Text>
      <Text style={styles.big}>{formatUsd(claimableUsd)}</Text>
      <Text style={styles.secondary}>Total incl. pending and claiming: {formatUsd(totalUsd)}</Text>
      <View style={styles.row}>
        <Text style={styles.fresh}>Updated {seconds}s ago</Text>
        <Pressable accessibilityRole="button" onPress={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.action}>Refresh</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  label: { fontSize: font.sm, color: colors.muted },
  big: { fontSize: font.xl, fontWeight: "700", color: colors.text },
  secondary: { fontSize: font.sm, color: colors.muted },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  fresh: { fontSize: font.sm, color: colors.muted },
  action: { fontSize: font.md, color: colors.primary, fontWeight: "600" },
});
