import { View, type ViewProps } from "react-native";

type ProgressProps = ViewProps & {
  value: number; // 0-100
  color?: string;
  trackClassName?: string;
  fillClassName?: string;
};

export function Progress({
  value,
  color,
  trackClassName = "",
  fillClassName = "",
  className = "",
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View
      className={`h-2 rounded-full bg-border overflow-hidden ${trackClassName} ${className}`}
      {...props}
    >
      <View
        className={`h-full rounded-full ${fillClassName}`}
        style={[
          { width: `${clamped}%` },
          color ? { backgroundColor: color } : undefined,
        ]}
      />
    </View>
  );
}
