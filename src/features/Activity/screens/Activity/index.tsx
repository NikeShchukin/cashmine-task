import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import type { ActivityItem } from "@/api/types";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, Loader } from "@/components/States";
import { colors, font, radius, spacing } from "@/theme";
import { formatSignedAmount } from "@/utils/amount";

import { useActivity } from "./useActivity";

const TYPE_LABEL: Record<ActivityItem["type"], string> = {
  accrual: "Accrual",
  reversal: "Reversal",
  claim: "Claim",
};

function Row({ item }: { item: ActivityItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.type}>
          {TYPE_LABEL[item.type]} · {item.asset}
        </Text>
        <Text style={item.amount.startsWith("-") ? styles.negative : styles.positive}>
          {formatSignedAmount(item.amount)}
        </Text>
      </View>
      <Text style={styles.meta}>
        {[item.status, item.exchange, new Date(item.createdAt).toLocaleString()].filter(Boolean).join(" · ")}
      </Text>
    </View>
  );
}

export function ActivityScreen() {
  const a = useActivity();

  if (a.isLoading) return <Loader />;
  if (a.error) return <ErrorState message={a.error.message} onRetry={a.retry} />;
  if (a.items.length === 0) return <EmptyState title="No activity yet" />;

  return (
    <Screen>
      <FlatList
        data={a.items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <Row item={item} />}
        contentContainerStyle={styles.list}
        onEndReached={a.loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          <View style={styles.footer}>
            {a.nextPageError ? (
              <ErrorBanner message={`Couldn't load more: ${a.nextPageError.message}`} onRetry={a.retryNextPage} />
            ) : a.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} />
            ) : a.hasNextPage ? (
              // Fallback when the list doesn't overflow and onEndReached never fires.
              <Button title="Load more" variant="secondary" onPress={a.loadMore} />
            ) : (
              <Text style={styles.end}>No more activity</Text>
            )}
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.sm },
  row: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  top: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  type: { fontSize: font.md, fontWeight: "600", color: colors.text },
  positive: { fontSize: font.md, fontWeight: "600", color: colors.success, flexShrink: 1, textAlign: "right" },
  negative: { fontSize: font.md, fontWeight: "600", color: colors.text, flexShrink: 1, textAlign: "right" },
  meta: { fontSize: font.sm, color: colors.muted },
  end: { fontSize: font.sm, color: colors.muted, textAlign: "center" },
  footer: { paddingVertical: spacing.lg, alignItems: "stretch" },
});
