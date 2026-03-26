import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { useSessionStore } from "@/lib/stores/session.store";

export default function RootLayout() {
  const setSession = useSessionStore((s) => s.setSession);
  const setBootstrapState = useSessionStore((s) => s.setBootstrapState);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (!session) {
          setBootstrapState("unauthenticated");
        } else if (!session.user.email_confirmed_at) {
          setBootstrapState("unverified");
        } else {
          setBootstrapState("ready");
        }
      })
      .catch(() => {
        setBootstrapState("unauthenticated");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setBootstrapState("unauthenticated");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  );
}
