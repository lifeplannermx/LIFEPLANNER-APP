import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { SwitchField } from "@/components/ui/SwitchField";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import { LIFE_STAGE_OPTIONS } from "@/lib/schemas/profile.schemas";
import * as profileService from "@/lib/api/profile.service";
import { useSessionStore } from "@/lib/stores/session.store";
import { useProfileStore } from "@/lib/stores/profile.store";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";

export default function OnboardingContextScreen() {
  const user = useSessionStore((s) => s.user);
  const setProfile = useProfileStore((s) => s.setProfile);
  const setBootstrapState = useSessionStore((s) => s.setBootstrapState);

  const [hasPartner, setHasPartner] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [lifeStage, setLifeStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    if (!user?.id) return;

    setError(null);
    setLoading(true);

    try {
      // Save context
      const { error: contextError } = await profileService.updateProfileContext(
        user.id,
        {
          has_partner: hasPartner,
          has_children: hasChildren,
          occupation: occupation.trim() || null,
          life_stage: lifeStage,
        }
      );
      if (contextError) {
        setError(contextError.message);
        return;
      }

      // Mark onboarding complete
      const { data, error: completeError } =
        await profileService.completeOnboarding(user.id);
      if (completeError) {
        setError(completeError.message);
        return;
      }
      if (data) {
        setProfile(data);
      }

      // Navigate to diagnostic
      setBootstrapState("needs_diagnostic");
      router.replace("/");
    } catch (e) {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.step}>Paso 2 de 2</Text>
          <Text style={styles.title}>Tu contexto</Text>
          <Text style={styles.subtitle}>
            Esta informacion nos ayuda a personalizar tu diagnostico.
          </Text>
        </View>

        <View style={styles.content}>
          <SwitchField
            label="Tienes pareja?"
            value={hasPartner}
            onToggle={setHasPartner}
          />

          <SwitchField
            label="Tienes hijos?"
            value={hasChildren}
            onToggle={setHasChildren}
          />

          <TextField
            label="Ocupacion (opcional)"
            placeholder="Ej: Ingeniero, Emprendedor, Freelancer"
            value={occupation}
            onChangeText={setOccupation}
            autoCapitalize="words"
          />

          <SelectField
            label="Etapa de vida"
            options={LIFE_STAGE_OPTIONS}
            value={lifeStage}
            onSelect={setLifeStage}
          />

          <InlineError message={error} />

          <View style={styles.buttons}>
            <Button
              title="Completar y comenzar diagnostico"
              onPress={handleComplete}
              loading={loading}
            />
            <Button
              title="Volver"
              onPress={() => router.back()}
              variant="ghost"
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingVertical: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  step: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  buttons: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
});
