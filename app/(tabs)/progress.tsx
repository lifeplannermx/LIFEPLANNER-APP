import { Text, StyleSheet } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { COLORS, FONT_SIZE, SPACING } from "@/constants/app";

export default function ProgressScreen() {
  return (
    <Screen centered>
      <Text style={styles.title}>Progreso</Text>
      <Text style={styles.subtitle}>Proximamente</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});
