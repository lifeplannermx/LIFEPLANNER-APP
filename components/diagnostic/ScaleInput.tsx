import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";

type ScaleInputProps = {
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

const SCALE_LABELS: Record<number, string> = {
  1: "Nada",
  2: "Poco",
  3: "Regular",
  4: "Bien",
  5: "Excelente",
};

export function ScaleInput({ value, onChange, min = 1, max = 5 }: ScaleInputProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View style={styles.container}>
      <View style={styles.optionsRow}>
        {options.map((n) => {
          const selected = value === n;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => onChange(n)}
              style={[
                styles.option,
                selected ? styles.optionSelected : styles.optionDefault,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionText,
                  selected ? styles.optionTextSelected : styles.optionTextDefault,
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.labelsRow}>
        <Text style={styles.labelText}>{SCALE_LABELS[min]}</Text>
        <Text style={styles.labelText}>{SCALE_LABELS[max]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  option: {
    flex: 1,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  optionDefault: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  optionText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "600",
  },
  optionTextSelected: {
    color: COLORS.textInverse,
  },
  optionTextDefault: {
    color: COLORS.textPrimary,
  },
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  labelText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
});
