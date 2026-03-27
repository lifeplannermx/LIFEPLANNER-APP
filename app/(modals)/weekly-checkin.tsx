import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { TextField } from "@/components/ui/TextField";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";
import { useSessionStore } from "@/lib/stores/session.store";
import { usePlanStore } from "@/lib/stores/plan.store";
import * as planService from "@/lib/api/plan.service";
import type { KpiWithVersion } from "@/types/plan";

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

export default function WeeklyCheckinScreen() {
  const user = useSessionStore((s) => s.user);
  const { cycle } = usePlanStore();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingCheckin, setExistingCheckin] = useState(false);

  const goals = cycle?.goals ?? [];
  const allKpis: Array<KpiWithVersion & { goalTitle: string; areaCode: string }> = [];
  for (const goal of goals) {
    for (const kpi of goal.kpis ?? []) {
      allKpis.push({
        ...kpi,
        goalTitle: goal.title,
        areaCode: goal.life_areas?.code ?? "",
      });
    }
  }

  useEffect(() => {
    loadExisting();
  }, []);

  async function loadExisting() {
    if (!user) return;
    const { data } = await planService.getWeeklyCheckin(user.id);
    if (data) {
      setCompletedIds(new Set(data.completed_kpi_ids));
      setNotes(data.notes ?? "");
      setExistingCheckin(true);
    }
    setLoading(false);
  }

  function toggleKpi(kpiId: string) {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(kpiId)) next.delete(kpiId);
      else next.add(kpiId);
      return next;
    });
  }

  async function handleSubmit() {
    if (!user || !cycle) return;
    setSaving(true);

    const { error } = await planService.submitWeeklyCheckin(
      user.id,
      cycle.id,
      Array.from(completedIds),
      notes.trim() || undefined
    );

    if (error) {
      console.warn("Check-in error:", error);
    }

    setSaving(false);
    router.back();
  }

  if (loading) {
    return (
      <Screen centered>
        <LoadingState message="Cargando..." />
      </Screen>
    );
  }

  const completedCount = completedIds.size;
  const totalKpis = allKpis.length;
  const percentage = totalKpis > 0 ? Math.round((completedCount / totalKpis) * 100) : 0;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{"\uD83D\uDCCB"}</Text>
          <Text style={styles.title}>Check-in semanal</Text>
          <Text style={styles.subtitle}>
            {existingCheckin
              ? "Ya registraste tu check-in esta semana. Puedes actualizarlo."
              : "Marca las actividades que cumpliste esta semana."}
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressNumber}>{completedCount}/{totalKpis}</Text>
          <Text style={styles.progressLabel}>Actividades cumplidas esta semana</Text>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${percentage}%` }]}
            />
          </View>
        </View>

        {/* KPI checklist grouped by goal */}
        {goals.map((goal) => {
          const icon = AREA_ICONS[goal.life_areas?.code ?? ""] ?? "\u2B50";
          const kpis = goal.kpis ?? [];
          if (kpis.length === 0) return null;

          return (
            <View key={goal.id} style={styles.goalGroup}>
              <View style={styles.goalGroupHeader}>
                <Text style={styles.goalGroupIcon}>{icon}</Text>
                <Text style={styles.goalGroupTitle}>{goal.title}</Text>
              </View>

              {kpis.map((kpi) => {
                const checked = completedIds.has(kpi.id);
                const v = kpi.latest_version;
                return (
                  <TouchableOpacity
                    key={kpi.id}
                    onPress={() => toggleKpi(kpi.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.kpiRow, checked && styles.kpiRowChecked]}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <Text style={styles.checkmark}>{"\u2713"}</Text>}
                      </View>
                      <View style={styles.kpiInfo}>
                        <Text
                          style={[
                            styles.kpiTitle,
                            checked && styles.kpiTitleChecked,
                          ]}
                        >
                          {v?.title ?? "Actividad"}
                        </Text>
                        <Text style={styles.kpiDetail}>
                          Meta: {v?.target_value} {v?.unit}/
                          {v?.frequency === "daily"
                            ? "dia"
                            : v?.frequency === "weekly"
                            ? "semana"
                            : "mes"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Notes */}
        <TextField
          label="Notas (opcional)"
          placeholder="Como te fue esta semana? Algo que quieras registrar..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />

        <View style={styles.actions}>
          <Button
            title={existingCheckin ? "Actualizar check-in" : "Registrar check-in"}
            onPress={handleSubmit}
            loading={saving}
          />
          <Button
            title="Cerrar"
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
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.xs,
  },
  progressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: COLORS.primary,
  },
  progressLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  progressTrack: {
    height: 8,
    width: "100%",
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.full,
  },
  goalGroup: {
    marginBottom: SPACING.md,
  },
  goalGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  goalGroupIcon: {
    fontSize: 20,
  },
  goalGroupTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  kpiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiRowChecked: {
    backgroundColor: COLORS.success + "10",
    borderColor: COLORS.success + "40",
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success,
  },
  checkmark: {
    color: COLORS.textInverse,
    fontWeight: "700",
    fontSize: 14,
  },
  kpiInfo: {
    flex: 1,
  },
  kpiTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  kpiTitleChecked: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },
  kpiDetail: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  actions: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
});
