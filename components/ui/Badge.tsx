import { View, Text, type ViewProps } from "react-native";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "outline";

type BadgeProps = ViewProps & {
  label: string;
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: "bg-primary-100", text: "text-primary-700" },
  success: { container: "bg-green-100", text: "text-green-700" },
  warning: { container: "bg-amber-100", text: "text-amber-700" },
  danger: { container: "bg-red-100", text: "text-red-700" },
  outline: { container: "border border-border bg-transparent", text: "text-text-secondary" },
};

export function Badge({ label, variant = "default", className = "", ...props }: BadgeProps) {
  const v = variantClasses[variant];
  return (
    <View className={`px-2.5 py-1 rounded-full self-start ${v.container} ${className}`} {...props}>
      <Text className={`text-xs font-semibold ${v.text}`}>{label}</Text>
    </View>
  );
}
