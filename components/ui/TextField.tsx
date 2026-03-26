import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  secureToggle?: boolean;
};

export function TextField({
  label,
  error,
  secureToggle = false,
  secureTextEntry,
  style,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          focused && styles.focused,
          error ? styles.errorBorder : null,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={hidden}
          autoCapitalize="none"
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity
            onPress={() => setHidden(!hidden)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{hidden ? "Mostrar" : "Ocultar"}</Text>
          </TouchableOpacity>
        )}
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
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  focused: {
    borderColor: COLORS.primary,
  },
  errorBorder: {
    borderColor: COLORS.danger,
  },
  error: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    marginTop: SPACING.xs,
  },
  toggle: {
    paddingHorizontal: SPACING.md,
  },
  toggleText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: "500",
  },
});
