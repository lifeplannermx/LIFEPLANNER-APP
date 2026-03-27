import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/SelectField";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";
import { LIMITS } from "@/constants/limits";
import { useSessionStore } from "@/lib/stores/session.store";
import { usePlanStore } from "@/lib/stores/plan.store";
import * as planService from "@/lib/api/plan.service";
import * as diagnosticService from "@/lib/api/diagnostic.service";
import { createGoalSchema } from "@/lib/schemas/plan.schemas";
import type { LifeArea } from "@/types/diagnostic";

const AREA_ICONS: Record<string, string> = {
  financial: "\uD83D\uDCB0",
  health: "\u2764\uFE0F",
  family: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67",
  relationship: "\uD83D\uDC9C",
  spiritual: "\uD83D\uDE4F",
  professional: "\uD83D\uDCBC",
  social: "\uD83E\uDD1D",
  leisure: "\uD83C\uDFAE",
};

export default function CreateGoalScreen() {
  const { areaId } = useLocalSearchParams<{ areaId?: string }>();
  const user = useSessionStore((s) => s.user);
  const { cycle, addGoal, getGoalCount } = usePlanStore();

  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>(areaId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAreas();
  }, []);

  async function loadAreas() {
    const { data } = await diagnosticService.getLifeAreas();
    if (data) setAreas(data);
  }

  const areaOptions = areas.map((a) => ({
    label: `${AREA_ICONS[a.code] ?? "\u2B50"} ${a.name}`,
    value: a.id,
  }));

  const goalCount = getGoalCount();
  const canAddMore = goalCount < LIMITS.MAX_ACTIVE_GOALS_PER_CYCLE;

  async function handleCreate() {
    if (!user || !cycle) return;

    setError(null);
    setFieldErrors({});

    if (!canAddMore) {
      setError(`Maximo ${LIMITS.MAX_ACTIVE_GOALS_PER_CYCLE} metas por ciclo`);
      return;
    }

    const parsed = createGoalSchema.safeParse({
      life_area_id: selectedArea,
      title: title.trim(),
      description: description.trim() || undefined,
      priority: goalCount + 1,
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

    setLoading(true);
    try {
      const { data: goal, error: createError } = await planService.createGoal(
        user.id,
        cycle.id,
        parsed.data
      );

      if (createError || !goal) {
        setError(createError?.message ?? "Error creando la meta");
        return;
      }

      addGoal(goal);
      router.push(`/(plan)/add-kpis?goalId=${goal.id}`);
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.step}>
            Meta {goalCount + 1} de {LIMITS.MAX_ACTIVE_GOALS_PER_CYCLE}
          </Text>
          <Text style={styles.title}>Nueva meta</Text>
          <Text style={styles.subtitle}>
            Define una meta para tu ciclo de 90 dias. Enfocate en lo que mas
            impacto tendra en tu vida.
          </Text>
        </View>

        <View style={styles.form}>
          <SelectField
            label="Area de vida"
            options={areaOptions}
            value={selectedArea}
            onSelect={setSelectedArea}
            error={fieldErrors.life_area_id}
          />

          <TextField
            label="Titulo de la meta"
            placeholder="Ej: Mejorar mi salud fisica"
            value={title}
            onChangeText={setTitle}
            error={fieldErrors.title}
          />

          <TextField
            label="Descripcion (opcional)"
            placeholder="Describe con mas detalle lo que quieres lograr"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <InlineError message={error} />

          <Button
            title="Siguiente: agregar actividades"
            onPress={handleCreate}
            loading={loading}
            disabled={!canAddMore}
          />

          <Button
            title="Cancelar"
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
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
  form: {
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
});
