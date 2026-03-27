import { View, Text, Image, type ViewProps } from "react-native";

type AvatarSize = "sm" | "md" | "lg" | "xl";

type AvatarProps = ViewProps & {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
};

const sizes: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-14 h-14", text: "text-lg" },
  xl: { container: "w-20 h-20", text: "text-2xl" },
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ uri, name, size = "md", className = "", ...props }: AvatarProps) {
  const s = sizes[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`${s.container} rounded-full ${className}`}
        {...(props as any)}
      />
    );
  }

  return (
    <View
      className={`${s.container} rounded-full bg-primary-100 items-center justify-center ${className}`}
      {...props}
    >
      <Text className={`${s.text} font-bold text-primary-700`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
