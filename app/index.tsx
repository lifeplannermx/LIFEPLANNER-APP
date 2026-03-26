import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useSessionStore } from "@/lib/stores/session.store";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";

export default function AppIndex() {
  const bootstrapState = useSessionStore((s) => s.bootstrapState);

  if (bootstrapState === "loading") {
    return (
      <Screen centered>
        <LoadingState message="Iniciando LifePlanner..." />
      </Screen>
    );
  }

  switch (bootstrapState) {
    case "unauthenticated":
      return <Redirect href="/(auth)/login" />;
    case "unverified":
      return <Redirect href="/(auth)/verify-email" />;
    case "needs_onboarding":
      return <Redirect href="/(onboarding)/profile" />;
    case "needs_diagnostic":
      return <Redirect href="/(diagnostic)/intro" />;
    case "diagnostic_processing":
      return <Redirect href="/(diagnostic)/processing" />;
    case "ready":
      return <Redirect href="/(tabs)" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}
