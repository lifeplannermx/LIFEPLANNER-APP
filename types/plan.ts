export interface Cycle {
  id: string;
  user_id: string;
  diagnostic_snapshot_id: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type GoalStatus = "active" | "paused" | "completed" | "abandoned";

export interface Goal {
  id: string;
  cycle_id: string;
  user_id: string;
  life_area_id: string;
  title: string;
  description: string | null;
  priority: number;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
  life_areas?: {
    id: string;
    code: string;
    name: string;
  };
  kpis?: KpiWithVersion[];
}

export interface Kpi {
  id: string;
  goal_id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type KpiFrequency = "daily" | "weekly" | "monthly";

export interface KpiVersion {
  id: string;
  kpi_id: string;
  title: string;
  description: string | null;
  target_value: number;
  unit: string;
  frequency: KpiFrequency;
  version_number: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  reminder_days: string[] | null;
  created_at: string;
}

export interface WeeklyCheckin {
  id: string;
  user_id: string;
  cycle_id: string;
  week_start: string;
  completed_kpi_ids: string[];
  notes: string | null;
  created_at: string;
}

export interface KpiWithVersion extends Kpi {
  latest_version: KpiVersion | null;
}

export interface CompletionLog {
  id: string;
  kpi_id: string;
  kpi_version_id: string;
  user_id: string;
  value: number;
  logged_at: string;
  notes: string | null;
  created_at: string;
}

export interface CycleWithGoals extends Cycle {
  goals: Goal[];
}
