import { View, Text, Switch, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";

type SwitchFieldProps = {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  description?: string;
};

export function SwitchField({
  label,
  value,
  onToggle,
  description,
}: SwitchFieldProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={value ? COLORS.primary : COLORS.textMuted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
