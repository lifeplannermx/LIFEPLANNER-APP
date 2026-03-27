import { create } from "zustand";
import type { Cycle, Goal, KpiWithVersion, CycleWithGoals } from "@/types/plan";

interface PlanState {
  cycle: CycleWithGoals | null;
  isLoading: boolean;

  setCycle: (cycle: CycleWithGoals | null) => void;
  setLoading: (v: boolean) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  addKpiToGoal: (goalId: string, kpi: KpiWithVersion) => void;
  removeKpiFromGoal: (goalId: string, kpiId: string) => void;
  getGoalCount: () => number;
  getKpiCount: (goalId: string) => number;
  reset: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  cycle: null,
  isLoading: false,

  setCycle: (cycle) => set({ cycle }),
  setLoading: (isLoading) => set({ isLoading }),

  addGoal: (goal) => {
    const { cycle } = get();
    if (!cycle) return;
    set({
      cycle: {
        ...cycle,
        goals: [...cycle.goals, { ...goal, kpis: goal.kpis ?? [] }],
      },
    });
  },

  updateGoal: (goalId, updates) => {
    const { cycle } = get();
    if (!cycle) return;
    set({
      cycle: {
        ...cycle,
        goals: cycle.goals.map((g) =>
          g.id === goalId ? { ...g, ...updates } : g
        ),
      },
    });
  },

  addKpiToGoal: (goalId, kpi) => {
    const { cycle } = get();
    if (!cycle) return;
    set({
      cycle: {
        ...cycle,
        goals: cycle.goals.map((g) =>
          g.id === goalId
            ? { ...g, kpis: [...(g.kpis ?? []), kpi] }
            : g
        ),
      },
    });
  },

  removeKpiFromGoal: (goalId, kpiId) => {
    const { cycle } = get();
    if (!cycle) return;
    set({
      cycle: {
        ...cycle,
        goals: cycle.goals.map((g) =>
          g.id === goalId
            ? { ...g, kpis: (g.kpis ?? []).filter((k) => k.id !== kpiId) }
            : g
        ),
      },
    });
  },

  getGoalCount: () => {
    const { cycle } = get();
    return cycle?.goals.filter((g) => g.status === "active").length ?? 0;
  },

  getKpiCount: (goalId) => {
    const { cycle } = get();
    const goal = cycle?.goals.find((g) => g.id === goalId);
    return goal?.kpis?.filter((k) => k.is_active).length ?? 0;
  },

  reset: () => set({ cycle: null, isLoading: false }),
}));
