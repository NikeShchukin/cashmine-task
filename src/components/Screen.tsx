import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, MAX_WIDTH } from "@/theme";

/** Phone-width column, centered on desktop. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.bg, alignItems: "center" },
  inner: { flex: 1, width: "100%", maxWidth: MAX_WIDTH },
});
