import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
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
import { createKpiSchema } from "@/lib/schemas/plan.schemas";
import type { KpiWithVersion, KpiFrequency } from "@/types/plan";

const FREQUENCY_OPTIONS = [
  { label: "Diario", value: "daily" as const },
  { label: "Semanal", value: "weekly" as const },
  { label: "Mensual", value: "monthly" as const },
] as const;

const UNIT_SUGGESTIONS = [
  "veces", "minutos", "horas", "paginas", "litros", "kilometros", "pesos",
];

export default function AddKpisScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const user = useSessionStore((s) => s.user);
  const { cycle, addKpiToGoal, getKpiCount } = usePlanStore();

  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("veces");
  const [frequency, setFrequency] = useState<string>("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [addedKpis, setAddedKpis] = useState<KpiWithVersion[]>([]);

  const goal = cycle?.goals.find((g) => g.id === goalId);
  const kpiCount = getKpiCount(goalId);
  const totalKpis = kpiCount + addedKpis.length;
  const canAddMore = totalKpis < LIMITS.MAX_ACTIVE_KPIS_PER_GOAL;

  async function handleAddKpi() {
    if (!user || !goalId) return;

    setError(null);
    setFieldErrors({});

    if (!canAddMore) {
      setError(`Maximo ${LIMITS.MAX_ACTIVE_KPIS_PER_GOAL} KPIs por meta`);
      return;
    }

    const parsed = createKpiSchema.safeParse({
      title: title.trim(),
      target_value: parseFloat(targetValue) || 0,
      unit: unit.trim(),
      frequency,
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
      const { data: kpi, error: createError } = await planService.createKpi(
        user.id,
        goalId,
        parsed.data
      );

      if (createError || !kpi) {
        setError(createError?.message ?? "Error creando el KPI");
        return;
      }

      addKpiToGoal(goalId, kpi);
      setAddedKpis((prev) => [...prev, kpi]);

      // Reset form
      setTitle("");
      setTargetValue("");
      setUnit("veces");
      setFrequency("daily");
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  }

  function handleDone() {
    if (addedKpis.length === 0) {
      Alert.alert(
        "Sin actividades",
        "Agrega al menos una actividad para medir tu progreso.",
        [{ text: "OK" }]
      );
      return;
    }
    // Navigate back to plan overview or add another goal
    router.push("/(plan)/overview");
  }

  const frequencyLabel = (f: string) => {
    if (f === "daily") return "al dia";
    if (f === "weekly") return "por semana";
    return "al mes";
  };

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.step}>
            Actividad {totalKpis + 1} de {LIMITS.MAX_ACTIVE_KPIS_PER_GOAL}
          </Text>
          <Text style={styles.title}>Agregar actividades</Text>
          <Text style={styles.subtitle}>
            {goal?.title
              ? `Define las acciones concretas para "${goal.title}"`
              : "Define actividades medibles para tu meta"}
          </Text>
        </View>

        {/* Added KPIs list */}
        {addedKpis.length > 0 && (
          <View style={styles.addedList}>
            {addedKpis.map((kpi, idx) => (
              <View key={kpi.id} style={styles.addedItem}>
                <Text style={styles.addedIcon}>{"\u2705"}</Text>
                <View style={styles.addedInfo}>
                  <Text style={styles.addedTitle}>
                    {kpi.latest_version?.title}
                  </Text>
                  <Text style={styles.addedDetail}>
                    {kpi.latest_version?.target_value}{" "}
                    {kpi.latest_version?.unit}{" "}
                    {frequencyLabel(kpi.latest_version?.frequency ?? "daily")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add KPI form */}
        {canAddMore && (
          <View style={styles.form}>
            <TextField
              label="Que actividad haras?"
              placeholder="Ej: Hacer ejercicio, Leer, Ahorrar"
              value={title}
              onChangeText={setTitle}
              error={fieldErrors.title}
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextField
                  label="Meta"
                  placeholder="Ej: 30"
                  value={targetValue}
                  onChangeText={setTargetValue}
                  keyboardType="numeric"
                  error={fieldErrors.target_value}
                />
              </View>
              <View style={styles.halfField}>
                <TextField
                  label="Unidad"
                  placeholder="Ej: minutos"
                  value={unit}
                  onChangeText={setUnit}
                  error={fieldErrors.unit}
                />
              </View>
            </View>

            {/* Unit suggestions */}
            <View style={styles.suggestions}>
              {UNIT_SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setUnit(s)}
                  style={[
                    styles.suggestionChip,
                    unit === s && styles.suggestionChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      unit === s && styles.suggestionTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <SelectField
              label="Frecuencia"
              options={FREQUENCY_OPTIONS}
              value={frequency}
              onSelect={setFrequency}
              error={fieldErrors.frequency}
            />

            <InlineError message={error} />

            <Button
              title={`Agregar actividad ${totalKpis + 1}`}
              onPress={handleAddKpi}
              loading={loading}
              variant="outline"
            />
          </View>
        )}

        {!canAddMore && (
          <View style={styles.maxReached}>
            <Text style={styles.maxText}>
              Llegaste al maximo de {LIMITS.MAX_ACTIVE_KPIS_PER_GOAL} actividades para
              esta meta.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title={
              addedKpis.length > 0
                ? "Continuar"
                : "Continuar sin KPIs"
            }
            onPress={handleDone}
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
    marginBottom: SPACING.lg,
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
  addedList: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  addedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addedIcon: {
    fontSize: 20,
  },
  addedInfo: {
    flex: 1,
  },
  addedTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  addedDetail: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  form: {
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  halfField: {
    flex: 1,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  suggestionChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "15",
  },
  suggestionText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  suggestionTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  maxReached: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  maxText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  actions: {
    gap: SPACING.sm,
  },
});
