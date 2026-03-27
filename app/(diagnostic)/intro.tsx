import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";

export default function DiagnosticIntroScreen() {
  return (
    <Screen centered>
      <View style={styles.container}>
        <Text style={styles.icon}>{"🔍"}</Text>
        <Text style={styles.title}>Diagnostico inicial</Text>
        <Text style={styles.description}>
          Antes de crear tu plan de 90 dias, necesitamos entender como estas en
          las 8 areas de tu vida.{"\n\n"}
          El test tiene preguntas de escala y preguntas abiertas. Toma
          aproximadamente 10-15 minutos.{"\n\n"}
          Tus respuestas son privadas y seran la base para generar tu
          diagnostico personalizado.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Comenzar diagnostico"
            onPress={() => router.push("/(diagnostic)/test/1")}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    width: "100%",
    gap: SPACING.sm,
  },
});
