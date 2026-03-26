import { Tabs } from "expo-router";
import { COLORS } from "@/constants/app";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.background,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoy",
          tabBarLabel: "Hoy",
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progreso",
          tabBarLabel: "Progreso",
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Grupos",
          tabBarLabel: "Grupos",
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Asistente",
          tabBarLabel: "Asistente",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
        }}
      />
    </Tabs>
  );
}
