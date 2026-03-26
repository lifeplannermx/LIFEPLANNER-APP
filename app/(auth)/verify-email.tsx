import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";
import * as authService from "@/lib/api/auth.service";
import { useSessionStore } from "@/lib/stores/session.store";

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useSessionStore((s) => s.user);
  const clear = useSessionStore((s) => s.clear);

  async function handleResend() {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const { error: resendError } = await authService.resendVerificationEmail(
        user.email
      );
      if (resendError) {
        setError(resendError.message);
        return;
      }
      setSent(true);
    } catch (e) {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckVerification() {
    setLoading(true);
    setError(null);
    try {
      const { session } = await authService.getSession();
      if (session?.user.email_confirmed_at) {
        router.replace("/");
      } else {
        setError("Email aun no verificado. Revisa tu bandeja.");
      }
    } catch (e) {
      setError("Error de conexion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await authService.signOut();
    clear();
    router.replace("/(auth)/login");
  }

  return (
    <Screen centered>
      <View style={styles.container}>
        <Text style={styles.icon}>{"📧"}</Text>
        <Text style={styles.title}>Verifica tu email</Text>
        <Text style={styles.description}>
          Enviamos un enlace de verificacion a{"\n"}
          <Text style={styles.email}>{user?.email ?? "tu email"}</Text>
        </Text>

        <InlineError message={error} />
        {sent && !error && (
          <Text style={styles.success}>Email reenviado correctamente</Text>
        )}

        <View style={styles.actions}>
          <Button
            title="Ya verifique mi email"
            onPress={handleCheckVerification}
            loading={loading}
          />
          <Button
            title="Reenviar email"
            onPress={handleResend}
            variant="outline"
            disabled={loading}
          />
          <Button
            title="Cerrar sesion"
            onPress={handleLogout}
            variant="ghost"
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  icon: {
    fontSize: 48,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  email: {
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  success: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.success,
    marginBottom: SPACING.md,
  },
  actions: {
    width: "100%",
    gap: SPACING.sm,
  },
});
