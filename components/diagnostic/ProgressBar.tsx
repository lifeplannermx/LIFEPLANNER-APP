import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";

type ProgressBarProps = {
  current: number;
  total: number;
  areaName: string;
};

export function ProgressBar({ current, total, areaName }: ProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.areaName}>{areaName}</Text>
        <Text style={styles.counter}>
          {current} de {total}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${progress}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  areaName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  counter: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  track: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
});
