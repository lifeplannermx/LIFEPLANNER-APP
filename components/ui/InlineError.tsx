import { Text, StyleSheet } from "react-native";
import { COLORS, FONT_SIZE, SPACING } from "@/constants/app";

type InlineErrorProps = {
  message?: string | null;
};

export function InlineError({ message }: InlineErrorProps) {
  if (!message) return null;

  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.danger,
    textAlign: "center",
    marginVertical: SPACING.sm,
  },
});
