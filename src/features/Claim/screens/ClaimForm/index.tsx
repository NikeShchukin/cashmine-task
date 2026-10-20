import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, Loader } from "@/components/States";
import { colors, font, radius, spacing } from "@/theme";
import { formatAmount } from "@/utils/amount";

import { useClaimForm } from "./useClaimForm";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ClaimFormScreen({ asset }: { asset: string }) {
  const f = useClaimForm(asset);

  if (f.isLoading) return <Loader />;
  if (f.loadError) return <ErrorState message={f.loadError.message} onRetry={f.retryLoad} />;
  if (f.notFound || !f.item || !f.options) return <EmptyState title={`No ${asset} balance`} />;
  if (f.unknownClaimKey) {
    return (
      <Screen>
        <View style={styles.body}>
          <ErrorBanner message={`An earlier ${asset} claim has an unknown result. Check it before claiming again.`} />
          <Button title="Check that claim" onPress={f.openUnknown} />
        </View>
      </Screen>
    );
  }
  if (f.destinations.length === 0) {
    return <EmptyState title="No destination" text={`There is nowhere to send ${asset} yet.`} />;
  }

  const destinationLabel = f.destinations.find((d) => d.id === f.destinationId)?.label ?? "";

  if (f.step === "confirm") {
    return (
      <Screen>
        <View style={styles.body}>
          <Text style={styles.title}>Confirm claim</Text>
          <View style={styles.card}>
            <Row label="Amount" value={`${f.validAmount} ${asset}`} />
            <Row label="Fee" value={`${formatAmount(f.options.fee)} ${asset}`} />
            <Row label="You receive" value={`${f.receive} ${asset}`} />
            <Row label="To" value={destinationLabel} />
          </View>
          <Button title="Confirm" onPress={f.confirm} loading={f.isSubmitting} />
          <Button title="Back" variant="secondary" onPress={f.back} disabled={f.isSubmitting} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Claim {asset}</Text>
        <Text style={styles.hint}>
          Available {formatAmount(f.item.available)} {asset} · Min {formatAmount(f.options.minAmount)}
        </Text>
        {f.submitError ? <ErrorBanner message={f.submitError} /> : null}
        <View style={styles.inputRow}>
          <TextInput
            value={f.amount}
            onChangeText={f.setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            inputMode="decimal"
            autoCorrect={false}
            style={styles.input}
          />
          <Pressable accessibilityRole="button" onPress={f.setMax} style={styles.max}>
            <Text style={styles.maxText}>Max</Text>
          </Pressable>
        </View>
        {f.validationError ? <Text style={styles.error}>{f.validationError}</Text> : null}
        {f.destinations.length > 1 ? (
          <View style={styles.card}>
            <Text style={styles.rowLabel}>Send to</Text>
            {f.destinations.map((d) => (
              <Pressable key={d.id} accessibilityRole="radio" onPress={() => f.setDestination(d.id)}>
                <Text style={d.id === f.destinationId ? styles.destActive : styles.dest}>{d.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.card}>
          <Row label="Fee" value={`${formatAmount(f.options.fee)} ${asset}`} />
          <Row label="You receive" value={f.receive ? `${f.receive} ${asset}` : "—"} />
          <Row label="To" value={destinationLabel} />
        </View>
        <Button title="Continue" onPress={f.goConfirm} disabled={!f.canContinue} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: font.lg, fontWeight: "700", color: colors.text },
  hint: { fontSize: font.sm, color: colors.muted },
  inputRow: { flexDirection: "row", gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.lg,
    color: colors.text,
  },
  max: { justifyContent: "center", paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  maxText: { color: colors.primary, fontWeight: "700", fontSize: font.md },
  error: { color: colors.danger, fontSize: font.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  rowLabel: { fontSize: font.md, color: colors.muted },
  rowValue: { fontSize: font.md, color: colors.text, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  dest: { fontSize: font.md, color: colors.text, paddingVertical: spacing.xs },
  destActive: { fontSize: font.md, color: colors.primary, fontWeight: "700", paddingVertical: spacing.xs },
});
