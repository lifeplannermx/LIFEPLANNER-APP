import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";

type Option = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  options: readonly Option[];
  value: string | null;
  onSelect: (value: string) => void;
  error?: string;
};

export function SelectField({
  label,
  options,
  value,
  onSelect,
  error,
}: SelectFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsRow}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                selected ? styles.optionSelected : styles.optionDefault,
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  selected ? styles.optionTextSelected : styles.optionTextDefault,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  option: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(99, 102, 241, 0.06)",
  },
  optionDefault: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  optionText: {
    fontSize: FONT_SIZE.sm,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  optionTextDefault: {
    color: COLORS.textSecondary,
  },
  error: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
});
