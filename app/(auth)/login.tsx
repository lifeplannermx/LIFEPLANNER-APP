import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link, router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";
import { LoginInputSchema } from "@/lib/schemas/auth.schemas";
import * as authService from "@/lib/api/auth.service";
import { useSessionStore } from "@/lib/stores/session.store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const setBootstrapState = useSessionStore((s) => s.setBootstrapState);

  async function handleLogin() {
    setError(null);
    setFieldErrors({});

    const result = LoginInputSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await authService.signIn(result.data);
      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Email o contrasena incorrectos"
            : authError.message
        );
        return;
      }
      if (data.session) {
        if (!data.session.user.email_confirmed_at) {
          setBootstrapState("unverified");
          router.replace("/(auth)/verify-email");
        } else {
          setBootstrapState("ready");
          router.replace("/(tabs)");
        }
      }
    } catch (e) {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>LifePlanner</Text>
          <Text style={styles.subtitle}>Tu transformacion personal</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={fieldErrors.email}
          />
          <TextField
            label="Contrasena"
            placeholder="Tu contrasena"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            secureToggle
            error={fieldErrors.password}
          />

          <InlineError message={error} />

          <Button
            title="Iniciar sesion"
            onPress={handleLogin}
            loading={loading}
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Button
              title="Olvidaste tu contrasena?"
              onPress={() => {}}
              variant="ghost"
            />
          </Link>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>No tienes cuenta?</Text>
          <Link href="/(auth)/register" asChild>
            <Button
              title="Crear cuenta"
              onPress={() => {}}
              variant="outline"
            />
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: "700",
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  footer: {
    alignItems: "center",
    gap: SPACING.sm,
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
});
