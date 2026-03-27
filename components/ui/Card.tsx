import { View, type ViewProps } from "react-native";

type CardProps = ViewProps & {
  variant?: "elevated" | "outline" | "ghost";
};

export function Card({ variant = "outline", className = "", ...props }: CardProps) {
  const base = "rounded-2xl p-4";
  const variants = {
    elevated: "bg-white shadow-sm shadow-black/10",
    outline: "bg-surface border border-border",
    ghost: "bg-transparent",
  };
  return <View className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: ViewProps) {
  return <View className={`pb-2 ${className}`} {...props} />;
}

export function CardContent({ className = "", ...props }: ViewProps) {
  return <View className={`${className}`} {...props} />;
}

export function CardFooter({ className = "", ...props }: ViewProps) {
  return <View className={`pt-3 ${className}`} {...props} />;
}
