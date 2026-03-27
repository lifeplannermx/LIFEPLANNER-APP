import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import {
  OnboardingProfileInputSchema,
  GENDER_OPTIONS,
} from "@/lib/schemas/profile.schemas";
import * as profileService from "@/lib/api/profile.service";
import { useSessionStore } from "@/lib/stores/session.store";
import { useProfileStore } from "@/lib/stores/profile.store";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";

export default function OnboardingProfileScreen() {
  const user = useSessionStore((s) => s.user);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [fullName, setFullName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleNext() {
    setError(null);
    setFieldErrors({});

    const parsed = OnboardingProfileInputSchema.safeParse({
      full_name: fullName.trim(),
      birth_year: parseInt(birthYear, 10) || 0,
      gender,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error: updateError } = await profileService.updateProfileBase(
        user.id,
        parsed.data
      );
      if (updateError) {
        setError(updateError.message);
        return;
      }
      if (data) {
        setProfile(data);
      }
      router.push("/(onboarding)/context");
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
          <Text style={styles.step}>Paso 1 de 2</Text>
          <Text style={styles.title}>Sobre ti</Text>
          <Text style={styles.subtitle}>
            Necesitamos conocerte un poco para personalizar tu experiencia.
          </Text>
        </View>

        <View style={styles.content}>
          <TextField
            label="Nombre completo"
            placeholder="Tu nombre"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            error={fieldErrors.full_name}
          />

          <TextField
            label="Ano de nacimiento"
            placeholder="Ej: 1990"
            value={birthYear}
            onChangeText={setBirthYear}
            keyboardType="number-pad"
            maxLength={4}
            error={fieldErrors.birth_year}
          />

          <SelectField
            label="Genero (opcional)"
            options={GENDER_OPTIONS}
            value={gender}
            onSelect={setGender}
            error={fieldErrors.gender}
          />

          <InlineError message={error} />

          <Button
            title="Siguiente"
            onPress={handleNext}
            loading={loading}
          />
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
});
