import { supabase } from "@/lib/supabase";
import type {
  OnboardingProfileInput,
  OnboardingContextInput,
} from "@/lib/schemas/profile.schemas";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
}

export async function updateProfileBase(
  userId: string,
  input: OnboardingProfileInput
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      birth_year: input.birth_year,
      gender: input.gender,
    })
    .eq("id", userId)
    .select()
    .single();
  return { data, error };
}

export async function updateProfileContext(
  userId: string,
  input: OnboardingContextInput
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      has_partner: input.has_partner,
      has_children: input.has_children,
      occupation: input.occupation,
      life_stage: input.life_stage,
    })
    .eq("id", userId)
    .select()
    .single();
  return { data, error };
}

export async function completeOnboarding(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();
  return { data, error };
}
