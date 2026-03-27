import { useState } from "react";
import { View, Text, TouchableOpacity, type ViewProps } from "react-native";

type AccordionItemProps = {
  title: string;
  titleLeft?: React.ReactNode;
  titleRight?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function AccordionItem({
  title,
  titleLeft,
  titleRight,
  children,
  defaultOpen = false,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View className="border border-border rounded-2xl mb-2 overflow-hidden bg-surface">
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
        className="flex-row items-center px-4 py-3 gap-3"
      >
        {titleLeft}
        <Text className="flex-1 text-base font-semibold text-text-primary">
          {title}
        </Text>
        {titleRight}
        <Text className="text-xs text-text-muted ml-1">
          {open ? "\u25B2" : "\u25BC"}
        </Text>
      </TouchableOpacity>
      {open && <View className="px-4 pb-4">{children}</View>}
    </View>
  );
}

type AccordionProps = ViewProps & {
  children: React.ReactNode;
};

export function Accordion({ children, className = "", ...props }: AccordionProps) {
  return (
    <View className={`${className}`} {...props}>
      {children}
    </View>
  );
}
