import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost"
              ? COLORS.primary
              : COLORS.textInverse
          }
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            textVariantStyles[variant],
            isDisabled && styles.disabledText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  text: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
};

const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: COLORS.textInverse,
  },
  secondary: {
    color: COLORS.textInverse,
  },
  outline: {
    color: COLORS.primary,
  },
  ghost: {
    color: COLORS.primary,
  },
  danger: {
    color: COLORS.textInverse,
  },
};
