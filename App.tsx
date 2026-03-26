import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { View, Text } from "react-native";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>LifePlanner</Text>
        <Text style={{ marginTop: 8, color: "#666" }}>Tu app de planificación</Text>
        <StatusBar style="auto" />
      </View>
    </QueryClientProvider>
  );
}
