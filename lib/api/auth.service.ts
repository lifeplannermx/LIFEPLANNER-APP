import { supabase } from "@/lib/supabase";
import type { LoginInput, RegisterInput, ForgotPasswordInput } from "@/lib/schemas/auth.schemas";

export async function signUp(input: RegisterInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });
  return { data, error };
}

export async function signIn(input: LoginInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(input: ForgotPasswordInput) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(
    input.email
  );
  return { data, error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

export async function resendVerificationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
  });
  return { data, error };
}
