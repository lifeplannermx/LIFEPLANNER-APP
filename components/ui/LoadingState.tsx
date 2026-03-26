import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Cargando..." }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  text: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
});
