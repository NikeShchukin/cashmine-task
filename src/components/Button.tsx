import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, font, radius, spacing } from "@/theme";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export function Button({ title, onPress, disabled, loading, variant = "primary" }: Props) {
  const secondary = variant === "secondary";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, secondary && styles.secondary, (disabled || loading) && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.primary : colors.primaryText} />
      ) : (
        <Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    minHeight: 46,
    justifyContent: "center",
  },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  text: { color: colors.primaryText, fontSize: font.md, fontWeight: "600" },
  secondaryText: { color: colors.primary },
});
