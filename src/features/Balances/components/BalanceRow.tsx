import { Pressable, StyleSheet, Text, View } from "react-native";

import type { BalanceItem } from "@/api/types";
import { colors, font, radius, spacing } from "@/theme";
import { formatAmount, formatUsd, usdValue } from "@/utils/amount";

export function BalanceRow({ item, onPress }: { item: BalanceItem; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.asset}>{item.asset}</Text>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatAmount(item.available)}</Text>
          <Text style={styles.usd}>{formatUsd(usdValue(item.available, item.usdPrice))}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        Pending {formatAmount(item.pending)} · Claiming {formatAmount(item.claiming)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.md },
  asset: { fontSize: font.lg, fontWeight: "700", color: colors.text },
  right: { alignItems: "flex-end", flexShrink: 1 },
  amount: { fontSize: font.lg, fontWeight: "600", color: colors.text },
  usd: { fontSize: font.sm, color: colors.muted },
  meta: { fontSize: font.sm, color: colors.muted },
});
