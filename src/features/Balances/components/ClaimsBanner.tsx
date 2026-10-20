import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, font, radius, spacing } from "@/theme";
import { formatAmount } from "@/utils/amount";

export interface BannerEntry {
  key: string;
  asset: string;
  amount: string;
  status: "pending" | "completed" | "failed" | "unknown";
  dismissible: boolean;
  open: () => void;
  dismiss: () => void;
}

const LABEL: Record<BannerEntry["status"], string> = {
  pending: "Processing",
  completed: "Completed",
  failed: "Failed",
  unknown: "Result unknown — tap to check",
};

export function ClaimsBanner({ entries }: { entries: BannerEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <View style={styles.box}>
      {entries.map((e) => (
        <View key={e.key} style={styles.row}>
          <Pressable accessibilityRole="button" onPress={e.open} style={styles.main}>
            <Text style={styles.text}>
              Claim {formatAmount(e.amount)} {e.asset}
            </Text>
            <Text style={[styles.status, styles[e.status]]}>{LABEL[e.status]}</Text>
          </Pressable>
          {e.dismissible ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={e.dismiss}>
              <Text style={styles.dismiss}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: colors.warningBg, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  main: { flex: 1 },
  text: { fontSize: font.md, color: colors.text, fontWeight: "600" },
  status: { fontSize: font.sm },
  pending: { color: colors.warning },
  completed: { color: colors.success },
  failed: { color: colors.danger },
  unknown: { color: colors.danger },
  dismiss: { fontSize: font.lg, color: colors.muted, paddingHorizontal: spacing.sm },
});
