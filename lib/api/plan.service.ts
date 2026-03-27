import { supabase } from "@/lib/supabase";
import { LIMITS } from "@/constants/limits";
import type {
  Cycle,
  Goal,
  Kpi,
  KpiVersion,
  KpiWithVersion,
  CompletionLog,
  CycleWithGoals,
  WeeklyCheckin,
} from "@/types/plan";
import type { CreateGoalInput, CreateKpiInput } from "@/lib/schemas/plan.schemas";

// ── Cycles ──────────────────────────────────────────────────────────

export async function getActiveCycle(userId: string) {
  const { data, error } = await supabase
    .from("cycles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return { data: data as Cycle | null, error };
}

export async function createCycle(
  userId: string,
  snapshotId?: string
) {
  const startsAt = new Date().toISOString().split("T")[0];
  const endsAt = new Date(
    Date.now() + LIMITS.CYCLE_DURATION_DAYS * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("cycles")
    .insert({
      user_id: userId,
      diagnostic_snapshot_id: snapshotId ?? null,
      starts_at: startsAt,
      ends_at: endsAt,
      is_active: true,
    })
    .select()
    .single();

  return { data: data as Cycle | null, error };
}

export async function deactivateCycle(cycleId: string) {
  const { error } = await supabase
    .from("cycles")
    .update({ is_active: false })
    .eq("id", cycleId);

  return { error };
}

// ── Goals ───────────────────────────────────────────────────────────

export async function getGoalsByCycle(cycleId: string) {
  const { data, error } = await supabase
    .from("goals")
    .select("*, life_areas(id, code, name)")
    .eq("cycle_id", cycleId)
    .order("priority");

  return { data: data as Goal[] | null, error };
}

export async function createGoal(
  userId: string,
  cycleId: string,
  input: CreateGoalInput
) {
  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      cycle_id: cycleId,
      life_area_id: input.life_area_id,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
    })
    .select("*, life_areas(id, code, name)")
    .single();

  return { data: data as Goal | null, error };
}

export async function updateGoal(
  goalId: string,
  updates: Partial<Pick<Goal, "title" | "description" | "priority" | "status">>
) {
  const { data, error } = await supabase
    .from("goals")
    .update(updates)
    .eq("id", goalId)
    .select("*, life_areas(id, code, name)")
    .single();

  return { data: data as Goal | null, error };
}

// ── KPIs ────────────────────────────────────────────────────────────

export async function getKpisByGoal(goalId: string) {
  const { data: kpis, error } = await supabase
    .from("kpis")
    .select("*")
    .eq("goal_id", goalId)
    .eq("is_active", true);

  if (error || !kpis) return { data: null, error };

  // Fetch latest version for each KPI
  const kpisWithVersions: KpiWithVersion[] = [];
  for (const kpi of kpis) {
    const { data: versions } = await supabase
      .from("kpi_versions")
      .select("*")
      .eq("kpi_id", kpi.id)
      .order("version_number", { ascending: false })
      .limit(1);

    kpisWithVersions.push({
      ...kpi,
      latest_version: (versions?.[0] as KpiVersion) ?? null,
    });
  }

  return { data: kpisWithVersions, error: null };
}

export async function createKpi(
  userId: string,
  goalId: string,
  input: CreateKpiInput
) {
  // Create KPI
  const { data: kpi, error: kpiError } = await supabase
    .from("kpis")
    .insert({
      user_id: userId,
      goal_id: goalId,
    })
    .select()
    .single();

  if (kpiError || !kpi) return { data: null, error: kpiError };

  // Create first version
  const { data: version, error: versionError } = await supabase
    .from("kpi_versions")
    .insert({
      kpi_id: kpi.id,
      title: input.title,
      description: input.description ?? null,
      target_value: input.target_value,
      unit: input.unit,
      frequency: input.frequency,
      version_number: 1,
      reminder_enabled: input.reminder_enabled ?? false,
      reminder_time: input.reminder_time ?? null,
      reminder_days: input.reminder_days ?? null,
    })
    .select()
    .single();

  if (versionError) return { data: null, error: versionError };

  const result: KpiWithVersion = {
    ...(kpi as Kpi),
    latest_version: version as KpiVersion,
  };

  return { data: result, error: null };
}

export async function deactivateKpi(kpiId: string) {
  const { error } = await supabase
    .from("kpis")
    .update({ is_active: false })
    .eq("id", kpiId);

  return { error };
}

// ── Completion Logs ─────────────────────────────────────────────────

export async function logCompletion(
  userId: string,
  kpiId: string,
  kpiVersionId: string,
  value: number,
  loggedAt?: string,
  notes?: string
) {
  const { data, error } = await supabase
    .from("completion_logs")
    .upsert(
      {
        user_id: userId,
        kpi_id: kpiId,
        kpi_version_id: kpiVersionId,
        value,
        logged_at: loggedAt ?? new Date().toISOString().split("T")[0],
        notes: notes ?? null,
      },
      { onConflict: "kpi_id,logged_at" }
    )
    .select()
    .single();

  return { data: data as CompletionLog | null, error };
}

export async function getCompletionLogs(
  kpiId: string,
  fromDate?: string,
  toDate?: string
) {
  let query = supabase
    .from("completion_logs")
    .select("*")
    .eq("kpi_id", kpiId)
    .order("logged_at", { ascending: false });

  if (fromDate) query = query.gte("logged_at", fromDate);
  if (toDate) query = query.lte("logged_at", toDate);

  const { data, error } = await query;
  return { data: data as CompletionLog[] | null, error };
}

export async function getTodayLogs(userId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("completion_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("logged_at", today);

  return { data: data as CompletionLog[] | null, error };
}

// ── Full cycle with goals and KPIs ──────────────────────────────────

export async function getFullCycle(userId: string) {
  const { data: cycle, error: cycleError } = await getActiveCycle(userId);
  if (cycleError || !cycle) return { data: null, error: cycleError };

  const { data: goals, error: goalsError } = await getGoalsByCycle(cycle.id);
  if (goalsError) return { data: null, error: goalsError };

  // Fetch KPIs for each goal
  const goalsWithKpis: Goal[] = [];
  for (const goal of goals ?? []) {
    const { data: kpis } = await getKpisByGoal(goal.id);
    goalsWithKpis.push({ ...goal, kpis: kpis ?? [] });
  }

  const result: CycleWithGoals = { ...cycle, goals: goalsWithKpis };
  return { data: result, error: null };
}

// ── Weekly Check-ins ────────────────────────────────────────────────

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export async function submitWeeklyCheckin(
  userId: string,
  cycleId: string,
  completedKpiIds: string[],
  notes?: string
) {
  const weekStart = getWeekStart();

  const { data, error } = await supabase
    .from("weekly_checkins")
    .upsert(
      {
        user_id: userId,
        cycle_id: cycleId,
        week_start: weekStart,
        completed_kpi_ids: completedKpiIds,
        notes: notes ?? null,
      },
      { onConflict: "user_id,week_start" }
    )
    .select()
    .single();

  return { data: data as WeeklyCheckin | null, error };
}

export async function getWeeklyCheckin(userId: string, weekStart?: string) {
  const ws = weekStart ?? getWeekStart();

  const { data, error } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", ws)
    .maybeSingle();

  return { data: data as WeeklyCheckin | null, error };
}
