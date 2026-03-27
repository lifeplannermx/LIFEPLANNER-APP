import { useEffect, useRef } from "react";
import { Animated, View, type ViewProps } from "react-native";

type SkeletonProps = ViewProps & {
  width?: number | string;
  height?: number;
  rounded?: "sm" | "md" | "lg" | "full";
};

export function Skeleton({
  width = "100%",
  height = 16,
  rounded = "md",
  className = "",
  ...props
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const roundedClass = {
    sm: "rounded",
    md: "rounded-lg",
    lg: "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  return (
    <Animated.View
      style={[{ width, height, opacity }]}
      className={`bg-border ${roundedClass} ${className}`}
      {...(props as any)}
    />
  );
}
