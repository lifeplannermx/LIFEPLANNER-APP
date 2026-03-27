import { z } from "zod";

export const createGoalSchema = z.object({
  life_area_id: z.string().uuid("Selecciona un area de vida"),
  title: z.string().min(3, "Minimo 3 caracteres").max(200, "Maximo 200 caracteres"),
  description: z.string().max(1000).optional(),
  priority: z.number().int().min(1).max(3).default(1),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const createKpiSchema = z.object({
  title: z.string().min(3, "Minimo 3 caracteres").max(200, "Maximo 200 caracteres"),
  description: z.string().max(500).optional(),
  target_value: z.number().positive("Debe ser mayor a 0"),
  unit: z.string().min(1, "Requerido").max(50).default("veces"),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  reminder_enabled: z.boolean().default(false),
  reminder_time: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM").optional(),
  reminder_days: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).optional(),
});

export type CreateKpiInput = z.infer<typeof createKpiSchema>;

export const logCompletionSchema = z.object({
  kpi_id: z.string().uuid(),
  value: z.number().min(0),
  logged_at: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type LogCompletionInput = z.infer<typeof logCompletionSchema>;
