import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link, router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";
import { RegisterInputSchema } from "@/lib/schemas/auth.schemas";
import * as authService from "@/lib/api/auth.service";
import { useSessionStore } from "@/lib/stores/session.store";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const setBootstrapState = useSessionStore((s) => s.setBootstrapState);

  async function handleRegister() {
    setError(null);
    setFieldErrors({});

    const result = RegisterInputSchema.safeParse({
      email,
      password,
      confirmPassword,
    });
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
      const { error: authError } = await authService.signUp(result.data);
      if (authError) {
        setError(authError.message);
        return;
      }
      setBootstrapState("unverified");
      router.replace("/(auth)/verify-email");
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
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Comienza tu transformacion personal
          </Text>
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
            placeholder="Minimo 8 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            secureToggle
            error={fieldErrors.password}
          />
          <TextField
            label="Confirmar contrasena"
            placeholder="Repite tu contrasena"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            secureToggle
            error={fieldErrors.confirmPassword}
          />

          <InlineError message={error} />

          <Button
            title="Crear cuenta"
            onPress={handleRegister}
            loading={loading}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ya tienes cuenta?</Text>
          <Link href="/(auth)/login" asChild>
            <Button
              title="Iniciar sesion"
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
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
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
