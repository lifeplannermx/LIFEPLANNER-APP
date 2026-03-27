import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { InlineError } from "@/components/ui/InlineError";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";
import { useSessionStore } from "@/lib/stores/session.store";
import { usePlanStore } from "@/lib/stores/plan.store";
import * as planService from "@/lib/api/plan.service";
import type { SuggestedGoal } from "@/lib/api/ai.service";
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

// Store suggested goals in a module-level variable (set from processing screen)
let _suggestedGoals: SuggestedGoal[] = [];
let _lifeAreas: LifeArea[] = [];

export function setSuggestedGoals(goals: SuggestedGoal[], areas: LifeArea[]) {
  _suggestedGoals = goals;
  _lifeAreas = areas;
}

export default function SuggestedGoalsScreen() {
  const user = useSessionStore((s) => s.user);
  const { cycle, addGoal, addKpiToGoal } = usePlanStore();
  const [selected, setSelected] = useState<Set<number>>(
    new Set(_suggestedGoals.map((_, i) => i))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goals = _suggestedGoals;

  function toggleGoal(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else if (next.size < 3) next.add(index);
      else Alert.alert("Maximo 3 metas", "Solo puedes seleccionar hasta 3 metas.");
      return next;
    });
  }

  async function handleAccept() {
    if (!user) return;

    // Load cycle from DB if not in store
    let activeCycle = cycle;
    if (!activeCycle) {
      const { data: fetchedCycle } = await planService.getActiveCycle(user.id);
      if (fetchedCycle) {
        activeCycle = { ...fetchedCycle, goals: [] };
        usePlanStore.getState().setCycle(activeCycle);
      }
    }

    if (!activeCycle) {
      setError("No se encontro un ciclo activo. Intenta de nuevo.");
      return;
    }

    if (selected.size === 0) {
      router.push("/(plan)/setup-reminders");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const selectedGoals = goals.filter((_, i) => selected.has(i));

      for (let i = 0; i < selectedGoals.length; i++) {
        const sg = selectedGoals[i];

        // Find life area ID
        const area = _lifeAreas.find((a) => a.code === sg.area_code);
        if (!area) continue;

        // Create goal
        const { data: goal, error: goalError } = await planService.createGoal(
          user.id,
          activeCycle.id,
          {
            life_area_id: area.id,
            title: sg.title,
            description: sg.description,
            priority: i + 1,
          }
        );

        if (goalError || !goal) {
          console.warn("Error creating goal:", goalError);
          continue;
        }

        addGoal(goal);

        // Create KPIs for this goal
        for (const kpiInput of sg.kpis) {
          const { data: kpi, error: kpiError } = await planService.createKpi(
            user.id,
            goal.id,
            {
              title: kpiInput.title,
              target_value: kpiInput.target_value,
              unit: kpiInput.unit,
              frequency: kpiInput.frequency,
              reminder_enabled: false,
            }
          );

          if (kpi) {
            addKpiToGoal(goal.id, kpi);
          } else {
            console.warn("Error creating KPI:", kpiError);
          }
        }
      }

      router.push("/(plan)/setup-reminders");
    } catch (err) {
      setError("Error guardando metas: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (goals.length === 0) {
    return (
      <Screen centered>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{"\uD83E\uDD14"}</Text>
          <Text style={styles.emptyTitle}>Sin sugerencias</Text>
          <Text style={styles.emptyText}>
            No se generaron sugerencias de metas. Puedes crear las tuyas
            manualmente.
          </Text>
          <Button
            title="Crear metas manualmente"
            onPress={() => router.replace("/(plan)/overview")}
          />
        </View>
      </Screen>
    );
  }

  const freqLabel = (f: string) =>
    f === "daily" ? "dia" : f === "weekly" ? "semana" : "mes";

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{"\uD83C\uDFAF"}</Text>
          <Text style={styles.title}>Metas sugeridas para ti</Text>
          <Text style={styles.subtitle}>
            Basado en tu diagnostico, te sugerimos estas metas para tu ciclo de
            90 dias. Selecciona las que quieras adoptar.
          </Text>
        </View>

        <Text style={styles.selectedCount}>
          {selected.size} de 3 seleccionadas
        </Text>

        {goals.map((goal, index) => {
          const isSelected = selected.has(index);
          const icon = AREA_ICONS[goal.area_code] ?? "\u2B50";

          return (
            <TouchableOpacity
              key={index}
              onPress={() => toggleGoal(index)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.goalCard,
                  isSelected && styles.goalCardSelected,
                ]}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.checkCircle}>
                    {isSelected && (
                      <Text style={styles.checkMark}>{"\u2713"}</Text>
                    )}
                  </View>
                  <Text style={styles.goalIcon}>{icon}</Text>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalArea}>{goal.area_name}</Text>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                  </View>
                </View>

                <Text style={styles.goalDescription}>{goal.description}</Text>

                <View style={styles.kpiSection}>
                  <Text style={styles.kpiLabel}>Actividades sugeridas:</Text>
                  {goal.kpis.map((kpi, kIdx) => (
                    <View key={kIdx} style={styles.kpiRow}>
                      <Text style={styles.kpiDot}>{"\u2022"}</Text>
                      <Text style={styles.kpiText}>
                        {kpi.title}{" "}
                        <Text style={styles.kpiTarget}>
                          ({kpi.target_value} {kpi.unit}/{freqLabel(kpi.frequency)})
                        </Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <InlineError message={error} />

        <View style={styles.actions}>
          <Button
            title={
              selected.size > 0
                ? `Aceptar ${selected.size} meta${selected.size > 1 ? "s" : ""}`
                : "Continuar sin metas"
            }
            onPress={handleAccept}
            loading={saving}
          />
          <Button
            title="Crear mis propias metas"
            onPress={() => router.replace("/(plan)/overview")}
            variant="outline"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  selectedCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  goalCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalInfo: {
    flex: 1,
  },
  goalArea: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  goalTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  goalDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  kpiSection: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  kpiLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
  },
  kpiRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginBottom: 2,
  },
  kpiDot: {
    color: COLORS.textMuted,
  },
  kpiText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  kpiTarget: {
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
});
