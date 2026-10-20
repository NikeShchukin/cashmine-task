import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { Screen } from "@/components/Screen";
import { colors, font, radius, spacing } from "@/theme";

import { useTokenScreen } from "./useTokenScreen";

export function TokenScreen() {
  const { value, setValue, canSave, save, expiredMessage } = useTokenScreen();
  return (
    <Screen>
      <View style={styles.body}>
        {expiredMessage ? <ErrorBanner message={expiredMessage} /> : null}
        <Text style={styles.label}>API token</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Paste your token"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={styles.input}
          onSubmitEditing={canSave ? save : undefined}
        />
        <Text style={styles.hint}>Stored only in this browser. You can change it later.</Text>
        <Button title="Save" onPress={save} disabled={!canSave} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md },
  label: { fontSize: font.md, fontWeight: "600", color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.md,
    color: colors.text,
  },
  hint: { fontSize: font.sm, color: colors.muted },
});
