import { View, type ViewProps } from "react-native";

type DividerProps = ViewProps & {
  orientation?: "horizontal" | "vertical";
};

export function Divider({ orientation = "horizontal", className = "", ...props }: DividerProps) {
  const base =
    orientation === "horizontal"
      ? "h-px w-full bg-border my-3"
      : "w-px h-full bg-border mx-3";

  return <View className={`${base} ${className}`} {...props} />;
}
