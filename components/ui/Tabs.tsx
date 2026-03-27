import { useState } from "react";
import { View, Text, TouchableOpacity, type ViewProps } from "react-native";

type Tab = {
  key: string;
  label: string;
};

type TabsProps = ViewProps & {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
};

export function TabBar({ tabs, activeTab, onTabChange, className = "", ...props }: TabsProps) {
  return (
    <View
      className={`flex-row bg-surface rounded-xl p-1 ${className}`}
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
            className={`flex-1 py-2 items-center rounded-lg ${
              isActive ? "bg-primary" : ""
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isActive ? "text-white" : "text-text-secondary"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
