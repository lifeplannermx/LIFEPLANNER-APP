import { View, Text, StyleSheet } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";
import * as authService from "@/lib/api/auth.service";
import { useSessionStore } from "@/lib/stores/session.store";
import { router } from "expo-router";

export default function TodayScreen() {
  const user = useSessionStore((s) => s.user);
  const clear = useSessionStore((s) => s.clear);

  async function handleLogout() {
    await authService.signOut();
    clear();
    router.replace("/(auth)/login");
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.greeting}>Hola!</Text>
        <Text style={styles.subtitle}>
          {user?.email ?? "Bienvenido a LifePlanner"}
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>Pantalla Hoy</Text>
          <Text style={styles.placeholderText}>
            Aqui veran tus 3-5 acciones prioritarias del dia.
            {"\n\n"}
            Primero necesitamos completar el onboarding y diagnostico.
          </Text>
        </View>

        <Button title="Cerrar sesion" onPress={handleLogout} variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  placeholder: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  placeholderTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  placeholderText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
