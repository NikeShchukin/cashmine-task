import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Screen } from "@/components/Screen";
import { colors, font, radius, spacing } from "@/theme";
import { formatAmount } from "@/utils/amount";

import { useClaimStatus } from "./useClaimStatus";

const STATUS_TEXT = { pending: "Processing…", completed: "Completed", failed: "Failed" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ClaimStatusScreen({ claimKey }: { claimKey: string }) {
  const s = useClaimStatus(claimKey);

  return (
    <Screen>
      <View style={styles.body}>
        {!s.entry ? (
          <>
            <Text style={styles.title}>{s.rejectedMessage ? "Claim was not created" : "Claim not found"}</Text>
            {s.rejectedMessage ? <ErrorBanner message={s.rejectedMessage} /> : null}
          </>
        ) : !s.claim ? (
          <>
            <Text style={styles.title}>Result unknown</Text>
            <Text style={styles.text}>
              We couldn&apos;t confirm whether your claim of {formatAmount(s.entry.body.amount)} {s.entry.body.asset} was
              created. Don&apos;t claim again — tap Check. It is safe: the same request can never create a second
              claim.
            </Text>
            <Button title="Check" onPress={s.check} loading={s.isChecking} />
          </>
        ) : (
          <>
            <Text style={[styles.title, styles[s.claim.status]]}>{STATUS_TEXT[s.claim.status]}</Text>
            <View style={styles.card}>
              <Row label="Amount" value={`${formatAmount(s.claim.amount)} ${s.claim.asset}`} />
              <Row label="Fee" value={`${formatAmount(s.claim.fee)} ${s.claim.asset}`} />
              <Row label="You receive" value={`${formatAmount(s.claim.receiveAmount)} ${s.claim.asset}`} />
            </View>
            {s.claim.status === "failed" && s.claim.failureReason ? (
              <ErrorBanner message={s.claim.failureReason} />
            ) : null}
            {s.pollError ? <ErrorBanner message={`Couldn't update status: ${s.pollError}`} onRetry={s.refresh} /> : null}
            {s.timedOut ? (
              <>
                <Text style={styles.muted}>Taking longer than usual.</Text>
                <Button title="Refresh" variant="secondary" onPress={s.refresh} />
              </>
            ) : null}
          </>
        )}
        <Button title="Back to balances" variant="secondary" onPress={s.goHome} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: font.lg, fontWeight: "700", color: colors.text },
  pending: { color: colors.warning },
  completed: { color: colors.success },
  failed: { color: colors.danger },
  text: { fontSize: font.md, color: colors.text },
  muted: { fontSize: font.sm, color: colors.muted },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  rowLabel: { fontSize: font.md, color: colors.muted },
  rowValue: { fontSize: font.md, color: colors.text, fontWeight: "600", flexShrink: 1, textAlign: "right" },
});
