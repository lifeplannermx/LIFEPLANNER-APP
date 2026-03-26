import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";
import { ForgotPasswordInputSchema } from "@/lib/schemas/auth.schemas";
import * as authService from "@/lib/api/auth.service";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleReset() {
    setError(null);
    setFieldErrors({});

    const result = ForgotPasswordInputSchema.safeParse({ email });
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
      const { error: resetError } = await authService.resetPassword(
        result.data
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    } catch (e) {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Screen centered>
        <View style={styles.container}>
          <Text style={styles.icon}>{"📬"}</Text>
          <Text style={styles.title}>Revisa tu email</Text>
          <Text style={styles.description}>
            Si existe una cuenta con ese email, recibiras instrucciones para
            recuperar tu acceso.
          </Text>
          <Link href="/(auth)/login" asChild>
            <Button title="Volver al inicio" onPress={() => {}} />
          </Link>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.container}>
        <Text style={styles.title}>Recuperar acceso</Text>
        <Text style={styles.description}>
          Ingresa tu email y te enviaremos instrucciones.
        </Text>

        <View style={styles.form}>
          <TextField
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={fieldErrors.email}
          />

          <InlineError message={error} />

          <Button
            title="Enviar instrucciones"
            onPress={handleReset}
            loading={loading}
          />
        </View>

        <Link href="/(auth)/login" asChild>
          <Button
            title="Volver al inicio"
            onPress={() => {}}
            variant="ghost"
          />
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
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
  form: {
    width: "100%",
    marginBottom: SPACING.md,
  },
});
