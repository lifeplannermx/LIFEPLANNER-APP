import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";
import { useSessionStore } from "@/lib/stores/session.store";
import { usePlanStore } from "@/lib/stores/plan.store";
import * as notificationsService from "@/lib/api/notifications.service";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 - 21:00
const DAYS = [
  { key: "mon", label: "L" },
  { key: "tue", label: "M" },
  { key: "wed", label: "Mi" },
  { key: "thu", label: "J" },
  { key: "fri", label: "V" },
  { key: "sat", label: "S" },
  { key: "sun", label: "D" },
] as const;

export default function SetupRemindersScreen() {
  const user = useSessionStore((s) => s.user);
  const { cycle } = usePlanStore();
  const goals = cycle?.goals ?? [];

  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [dailyHour, setDailyHour] = useState(8);
  const [dailyMinute, setDailyMinute] = useState(0);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])
  );

  const [checkinEnabled, setCheckinEnabled] = useState(true);
  const [checkinDay, setCheckinDay] = useState("sun");
  const [checkinHour, setCheckinHour] = useState(19);

  const [saving, setSaving] = useState(false);

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        if (next.size > 1) next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);

    try {
      // Request permissions
      const hasPermission = await notificationsService.requestPermissions();

      if (!hasPermission) {
        Alert.alert(
          "Permisos necesarios",
          "Necesitamos permiso para enviarte recordatorios. Puedes activarlo en Configuracion.",
          [{ text: "Continuar sin recordatorios", onPress: () => navigateNext() }]
        );
        setSaving(false);
        return;
      }

      // Configure notification handler
      notificationsService.configureNotificationHandler();

      // Schedule KPI reminders
      if (dailyEnabled) {
        const timeStr = `${String(dailyHour).padStart(2, "0")}:${String(dailyMinute).padStart(2, "0")}`;
        const days = Array.from(selectedDays);

        for (const goal of goals) {
          for (const kpi of goal.kpis ?? []) {
            if (kpi.latest_version) {
              await notificationsService.scheduleKpiReminder(
                kpi.id,
                {
                  ...kpi.latest_version,
                  reminder_enabled: true,
                  reminder_time: timeStr,
                  reminder_days: days,
                },
                goal.title
              );
            }
          }
        }
      }

      // Schedule weekly check-in
      if (checkinEnabled) {
        await notificationsService.scheduleWeeklyCheckin(
          checkinDay,
          checkinHour,
          0
        );
      }

      navigateNext();
    } catch (err) {
      console.warn("Error setting up notifications:", err);
      navigateNext();
    } finally {
      setSaving(false);
    }
  }

  function navigateNext() {
    router.replace("/(plan)/overview");
  }

  const formatTime = (h: number, m: number) =>
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>{"\uD83D\uDD14"}</Text>
          <Text style={styles.title}>Recordatorios</Text>
          <Text style={styles.subtitle}>
            Configura cuando quieres que te recordemos tus compromisos. Esto
            aumenta significativamente la probabilidad de cumplir tus metas.
          </Text>
        </View>

        {/* Daily reminder */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardIcon}>{"\u2600\uFE0F"}</Text>
              <Text style={styles.cardTitle}>Recordatorio diario</Text>
            </View>
            <Switch
              value={dailyEnabled}
              onValueChange={setDailyEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={dailyEnabled ? COLORS.primary : COLORS.textMuted}
            />
          </View>

          {dailyEnabled && (
            <View style={styles.cardBody}>
              <Text style={styles.fieldLabel}>Hora del recordatorio</Text>
              <View style={styles.timeSelector}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setDailyHour(Math.max(6, dailyHour - 1))}
                >
                  <Text style={styles.timeButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.timeDisplay}>
                  {formatTime(dailyHour, dailyMinute)}
                </Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setDailyHour(Math.min(21, dailyHour + 1))}
                >
                  <Text style={styles.timeButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Dias activos</Text>
              <View style={styles.daysRow}>
                {DAYS.map((d) => {
                  const active = selectedDays.has(d.key);
                  return (
                    <TouchableOpacity
                      key={d.key}
                      onPress={() => toggleDay(d.key)}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          active && styles.dayChipTextActive,
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.hint}>
                Recibiras un recordatorio a las {formatTime(dailyHour, dailyMinute)}{" "}
                con tus acciones del dia.
              </Text>
            </View>
          )}
        </View>

        {/* Weekly check-in */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardIcon}>{"\uD83D\uDCCB"}</Text>
              <Text style={styles.cardTitle}>Check-in semanal</Text>
            </View>
            <Switch
              value={checkinEnabled}
              onValueChange={setCheckinEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={checkinEnabled ? COLORS.primary : COLORS.textMuted}
            />
          </View>

          {checkinEnabled && (
            <View style={styles.cardBody}>
              <Text style={styles.fieldLabel}>Dia del check-in</Text>
              <View style={styles.daysRow}>
                {DAYS.map((d) => (
                  <TouchableOpacity
                    key={d.key}
                    onPress={() => setCheckinDay(d.key)}
                    style={[
                      styles.dayChip,
                      checkinDay === d.key && styles.dayChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayChipText,
                        checkinDay === d.key && styles.dayChipTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Hora</Text>
              <View style={styles.timeSelector}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setCheckinHour(Math.max(6, checkinHour - 1))}
                >
                  <Text style={styles.timeButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.timeDisplay}>
                  {formatTime(checkinHour, 0)}
                </Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setCheckinHour(Math.min(21, checkinHour + 1))}
                >
                  <Text style={styles.timeButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.hint}>
                Cada semana te preguntaremos si cumpliste tus metas para
                registrar tu progreso.
              </Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {goals.length} meta{goals.length !== 1 ? "s" : ""} con{" "}
            {goals.reduce((sum, g) => sum + (g.kpis?.length ?? 0), 0)} KPIs
            configurados
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Activar recordatorios"
            onPress={handleSave}
            loading={saving}
          />
          <Button
            title="Continuar sin recordatorios"
            onPress={navigateNext}
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
    textAlign: "center",
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  cardBody: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  timeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  timeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  timeButtonText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  timeDisplay: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.textPrimary,
    minWidth: 90,
    textAlign: "center",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  dayChip: {
    flex: 1,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  dayChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  dayChipTextActive: {
    color: COLORS.textInverse,
  },
  hint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  summary: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  summaryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  actions: {
    gap: SPACING.sm,
  },
});
