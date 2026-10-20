import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors, font, spacing } from "@/theme";

import { Button } from "./Button";

export function Loader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.text}>{message}</Text>
      <Button title="Retry" onPress={onRetry} />
    </View>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  title: { fontSize: font.lg, fontWeight: "600", color: colors.text, textAlign: "center" },
  text: { fontSize: font.md, color: colors.muted, textAlign: "center" },
});
