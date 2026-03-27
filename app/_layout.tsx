import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/lib/stores/session.store";
import { useProfileStore } from "@/lib/stores/profile.store";
import * as profileService from "@/lib/api/profile.service";
import * as diagnosticService from "@/lib/api/diagnostic.service";
import * as planService from "@/lib/api/plan.service";
export default function RootLayout() {
  const setSession = useSessionStore((s) => s.setSession);
  const setBootstrapState = useSessionStore((s) => s.setBootstrapState);
  const setProfile = useProfileStore((s) => s.setProfile);

  useEffect(() => {
    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setBootstrapState("unauthenticated");
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function bootstrap() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (!session) {
        setBootstrapState("unauthenticated");
        return;
      }

      if (!session.user.email_confirmed_at) {
        setBootstrapState("unverified");
        return;
      }

      // Fetch profile to check onboarding status
      const { data: profile } = await profileService.getProfile(
        session.user.id
      );

      if (profile) {
        setProfile(profile);

        if (!profile.onboarding_completed_at || !profile.full_name) {
          setBootstrapState("needs_onboarding");
          return;
        }

        // Check if user has completed the diagnostic
        const { data: snapshot } = await diagnosticService.getLatestSnapshot(
          session.user.id
        );

        if (!snapshot) {
          setBootstrapState("needs_diagnostic");
          return;
        }

        // Check if user has an active cycle
        const { data: cycle } = await planService.getActiveCycle(
          session.user.id
        );

        if (!cycle) {
          setBootstrapState("needs_plan");
          return;
        }

        setBootstrapState("ready");
      } else {
        // Profile doesn't exist yet
        setBootstrapState("needs_onboarding");
      }
    } catch {
      setBootstrapState("unauthenticated");
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(diagnostic)" />
        <Stack.Screen name="(plan)" />
        <Stack.Screen name="(modals)" options={{ presentation: "modal" }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
