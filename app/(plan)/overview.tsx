import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";
import { LIMITS } from "@/constants/limits";
import { useSessionStore } from "@/lib/stores/session.store";
import { usePlanStore } from "@/lib/stores/plan.store";
import * as planService from "@/lib/api/plan.service";

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

export default function PlanOverviewScreen() {
  const user = useSessionStore((s) => s.user);
  const setBootstrapState = useSessionStore((s) => s.setBootstrapState);
  const { cycle, setCycle, getGoalCount } = usePlanStore();
  const [loading, setLoading] = useState(!cycle);

  useEffect(() => {
    if (!cycle && user) {
      loadCycle();
    }
  }, []);

  async function loadCycle() {
    if (!user) return;
    setLoading(true);
    const { data } = await planService.getFullCycle(user.id);
    if (data) setCycle(data);
    setLoading(false);
  }

  function handleAddGoal() {
    router.push("/(plan)/create-goal");
  }

  function handleFinish() {
    setBootstrapState("ready");
    router.replace("/(tabs)");
  }

  if (loading) {
    return (
      <Screen centered>
        <LoadingState message="Cargando tu plan..." />
      </Screen>
    );
  }

  const goals = cycle?.goals ?? [];
  const goalCount = getGoalCount();
  const canAddMore = goalCount < LIMITS.MAX_ACTIVE_GOALS_PER_CYCLE;
  const daysLeft = cycle
    ? Math.ceil(
        (new Date(cycle.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : LIMITS.CYCLE_DURATION_DAYS;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tu plan de 90 dias</Text>
          <Text style={styles.subtitle}>
            {daysLeft} dias restantes en tu ciclo
          </Text>
        </View>

        {/* Cycle progress bar */}
        <View style={styles.cycleCard}>
          <View style={styles.cycleRow}>
            <Text style={styles.cycleLabel}>Ciclo activo</Text>
            <Text style={styles.cycleDates}>
              {cycle?.starts_at} → {cycle?.ends_at}
            </Text>
          </View>
          <View style={styles.cycleTrack}>
            <View
              style={[
                styles.cycleFill,
                {
                  width: `${Math.max(
                    5,
                    ((LIMITS.CYCLE_DURATION_DAYS - daysLeft) /
                      LIMITS.CYCLE_DURATION_DAYS) *
                      100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Goals list */}
        <Text style={styles.sectionTitle}>
          Metas ({goalCount}/{LIMITS.MAX_ACTIVE_GOALS_PER_CYCLE})
        </Text>

        {goals.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>{"\uD83C\uDFAF"}</Text>
            <Text style={styles.emptyText}>
              Aun no tienes metas. Agrega tu primera meta para comenzar.
            </Text>
          </View>
        )}

        {goals.map((goal) => {
          const areaCode = goal.life_areas?.code ?? "";
          const icon = AREA_ICONS[areaCode] ?? "\u2B50";
          const kpiCount = goal.kpis?.length ?? 0;
          return (
            <TouchableOpacity
              key={goal.id}
              style={styles.goalCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push(`/(plan)/add-kpis?goalId=${goal.id}`)
              }
            >
              <View style={styles.goalHeader}>
                <Text style={styles.goalIcon}>{icon}</Text>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalArea}>
                    {goal.life_areas?.name ?? "Area"}
                  </Text>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                </View>
                <View style={styles.goalBadge}>
                  <Text style={styles.goalBadgeText}>
                    {kpiCount} actividad{kpiCount !== 1 ? "es" : ""}
                  </Text>
                </View>
              </View>
              {goal.kpis && goal.kpis.length > 0 && (
                <View style={styles.kpiList}>
                  {goal.kpis.map((kpi) => (
                    <View key={kpi.id} style={styles.kpiItem}>
                      <Text style={styles.kpiDot}>{"\u2022"}</Text>
                      <Text style={styles.kpiText}>
                        {kpi.latest_version?.title ?? "KPI"}{" "}
                        <Text style={styles.kpiTarget}>
                          ({kpi.latest_version?.target_value}{" "}
                          {kpi.latest_version?.unit}/
                          {kpi.latest_version?.frequency === "daily"
                            ? "dia"
                            : kpi.latest_version?.frequency === "weekly"
                            ? "sem"
                            : "mes"}
                          )
                        </Text>
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Actions */}
        <View style={styles.actions}>
          {canAddMore && (
            <Button
              title={`Agregar meta ${goalCount + 1}`}
              onPress={handleAddGoal}
              variant="outline"
            />
          )}
          <Button
            title={goals.length > 0 ? "Ir a mi plan" : "Continuar sin metas"}
            onPress={handleFinish}
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
    marginBottom: SPACING.lg,
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
  },
  cycleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cycleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  cycleLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  cycleDates: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  cycleTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  cycleFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
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
  goalBadge: {
    backgroundColor: COLORS.primary + "15",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  goalBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
  kpiList: {
    marginTop: SPACING.sm,
    paddingLeft: SPACING.xl + SPACING.sm,
    gap: 4,
  },
  kpiItem: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  kpiDot: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.md,
  },
  kpiText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  kpiTarget: {
    color: COLORS.textMuted,
  },
  actions: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
});
