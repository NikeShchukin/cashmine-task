import { Pressable, RefreshControl, ScrollView, StyleSheet, Text } from "react-native";

import { ErrorBanner } from "@/components/ErrorBanner";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, Loader } from "@/components/States";
import { BalanceRow } from "@/features/Balances/components/BalanceRow";
import { ClaimsBanner } from "@/features/Balances/components/ClaimsBanner";
import { TotalsHeader } from "@/features/Balances/components/TotalsHeader";
import { colors, font, spacing } from "@/theme";

import { useHome } from "./useHome";

export function HomeScreen() {
  const { isLoading, error, hasData, isRefreshing, refresh, asOf, items, totals, banner, openClaim, changeToken } =
    useHome();

  if (isLoading) return <Loader />;
  if (!hasData || !asOf) return <ErrorState message={error?.message ?? "Unknown error"} onRetry={refresh} />;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      >
        {error ? <ErrorBanner message={`Couldn't refresh: ${error.message}`} onRetry={refresh} /> : null}
        <TotalsHeader
          claimableUsd={totals.claimableUsd}
          totalUsd={totals.totalUsd}
          asOf={asOf}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
        />
        <ClaimsBanner entries={banner} />
        {items.length === 0 ? (
          <EmptyState title="No payback yet" text="Trade on a connected exchange to start earning." />
        ) : (
          items.map((item) => <BalanceRow key={item.asset} item={item} onPress={() => openClaim(item.asset)} />)
        )}
        <Pressable accessibilityRole="button" onPress={changeToken}>
          <Text style={styles.link}>Change token</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  link: { color: colors.primary, fontSize: font.md, textAlign: "center", paddingVertical: spacing.md },
});
