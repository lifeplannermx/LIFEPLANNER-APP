import { z } from "zod";
import { LIMITS } from "@/constants/limits";

export const ProfileBaseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1).max(LIMITS.FULL_NAME_MAX_LENGTH),
  birth_year: z.number().int().min(1900).max(2100),
  gender: z.string().nullable(),
  has_partner: z.boolean(),
  has_children: z.boolean(),
  occupation: z.string().nullable(),
  life_stage: z.string().nullable(),
  avatar_path: z.string().nullable(),
  public_alias: z.string().nullable(),
  onboarding_completed_at: z.string().nullable(),
  account_status: z.enum(["active", "pending_deletion", "deleted"]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Profile = z.infer<typeof ProfileBaseSchema>;

export const OnboardingProfileInputSchema = z.object({
  full_name: z
    .string()
    .min(1, "Nombre requerido")
    .max(LIMITS.FULL_NAME_MAX_LENGTH, `Maximo ${LIMITS.FULL_NAME_MAX_LENGTH} caracteres`),
  birth_year: z
    .number()
    .int()
    .min(1940, "Ano no valido")
    .max(2010, "Debes tener al menos 16 anos"),
  gender: z.string().nullable(),
});

export type OnboardingProfileInput = z.infer<typeof OnboardingProfileInputSchema>;

export const OnboardingContextInputSchema = z.object({
  has_partner: z.boolean(),
  has_children: z.boolean(),
  occupation: z.string().max(100).nullable(),
  life_stage: z.string().nullable(),
});

export type OnboardingContextInput = z.infer<typeof OnboardingContextInputSchema>;

export const GENDER_OPTIONS = [
  { label: "Masculino", value: "male" },
  { label: "Femenino", value: "female" },
  { label: "Otro", value: "other" },
  { label: "Prefiero no decir", value: "prefer_not_to_say" },
] as const;

export const LIFE_STAGE_OPTIONS = [
  { label: "Estudiante", value: "student" },
  { label: "Inicio de carrera", value: "early_career" },
  { label: "Carrera establecida", value: "mid_career" },
  { label: "Emprendedor", value: "entrepreneur" },
  { label: "Transicion", value: "transition" },
  { label: "Otro", value: "other" },
] as const;
