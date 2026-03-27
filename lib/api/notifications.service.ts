/**
 * Notifications Service — manages local push notifications via expo-notifications.
 * All notifications are LOCAL (no server needed).
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { KpiVersion } from "@/types/plan";

// ── Setup ───────────────────────────────────────────────────────────

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ── Schedule KPI reminders ──────────────────────────────────────────

const DAY_MAP: Record<string, number> = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
};

export async function scheduleKpiReminder(
  kpiId: string,
  kpiVersion: KpiVersion & {
    reminder_enabled?: boolean;
    reminder_time?: string | null;
    reminder_days?: string[] | null;
  },
  goalTitle: string
): Promise<string[]> {
  if (!kpiVersion.reminder_enabled || !kpiVersion.reminder_time) {
    return [];
  }

  const hasPermission = await requestPermissions();
  if (!hasPermission) return [];

  // Parse time "HH:MM"
  const [hours, minutes] = kpiVersion.reminder_time.split(":").map(Number);

  const scheduledIds: string[] = [];

  if (kpiVersion.frequency === "daily") {
    const days = kpiVersion.reminder_days ?? [
      "mon", "tue", "wed", "thu", "fri", "sat", "sun",
    ];

    for (const day of days) {
      const weekday = DAY_MAP[day];
      if (!weekday) continue;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `LifePlanner: ${kpiVersion.title}`,
          body: `Recuerda: ${kpiVersion.target_value} ${kpiVersion.unit} hoy. Meta: ${goalTitle}`,
          data: { type: "kpi_reminder", kpiId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: hours,
          minute: minutes,
        },
      });
      scheduledIds.push(id);
    }
  } else if (kpiVersion.frequency === "weekly") {
    // Pick first day or monday
    const day = kpiVersion.reminder_days?.[0] ?? "mon";
    const weekday = DAY_MAP[day] ?? 2;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `LifePlanner: ${kpiVersion.title}`,
        body: `Esta semana: ${kpiVersion.target_value} ${kpiVersion.unit}. Meta: ${goalTitle}`,
        data: { type: "kpi_reminder", kpiId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: hours,
        minute: minutes,
      },
    });
    scheduledIds.push(id);
  }

  return scheduledIds;
}

// ── Schedule weekly check-in ────────────────────────────────────────

export async function scheduleWeeklyCheckin(
  dayOfWeek: string = "sun",
  hour: number = 19,
  minute: number = 0
): Promise<string | null> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  // Cancel existing check-in notification
  await cancelNotificationsByType("weekly_checkin");

  const weekday = DAY_MAP[dayOfWeek] ?? 1;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "LifePlanner: Check-in semanal",
      body: "¿Cumpliste tus metas esta semana? Toma un momento para revisar tu progreso.",
      data: { type: "weekly_checkin" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    },
  });

  return id;
}

// ── Cancel notifications ────────────────────────────────────────────

export async function cancelKpiReminders(kpiId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.kpiId === kpiId) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

export async function cancelNotificationsByType(type: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledCount(): Promise<number> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
