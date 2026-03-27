import React, { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { useSessionStore } from "@/lib/stores/session.store";
import { useProfileStore } from "@/lib/stores/profile.store";
import { useDiagnosticStore } from "@/lib/stores/diagnostic.store";
import * as diagnosticService from "@/lib/api/diagnostic.service";
import * as planService from "@/lib/api/plan.service";
import * as aiService from "@/lib/api/ai.service";
import { setSuggestedGoals } from "@/app/(plan)/suggested-goals";
import { usePlanStore } from "@/lib/stores/plan.store";
import { supabase } from "@/lib/supabase";
import { COLORS, SPACING, FONT_SIZE } from "@/constants/app";

const MESSAGES = [
  "Guardando tus respuestas...",
  "Calculando tus puntajes...",
  "Buscando tu segmento de comparacion...",
  "Analizando las 8 areas de tu vida...",
  "Detectando patrones y conexiones...",
  "Generando tu diagnostico personalizado...",
  "Creando tu plan de accion...",
  "Casi listo...",
];

export default function DiagnosticProcessingScreen() {
  const user = useSessionStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const diagnosticStore = useDiagnosticStore();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const msgIdx = useRef(0);
  const [message, setMessage] = useState(MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);
  const processingStarted = useRef(false);

  useEffect(() => {
    // Spinner animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Rotate messages
    const interval = setInterval(() => {
      msgIdx.current = Math.min(msgIdx.current + 1, MESSAGES.length - 1);
      setMessage(MESSAGES[msgIdx.current]);
    }, 3000);

    // Start processing
    if (!processingStarted.current) {
      processingStarted.current = true;
      runProcessing();
    }

    return () => clearInterval(interval);
  }, []);

  async function runProcessing() {
    if (!user || !profile) {
      setError("No se encontro la sesion del usuario.");
      return;
    }

    try {
      // Step 1: Submit responses to DB
      const allAnswers = diagnosticStore.getAllAnswers();
      const responsesToSave = allAnswers
        .filter((a) => {
          if (a.question_type === "scale") return a.scale_value != null;
          if (a.question_type === "open") return !!a.open_text?.trim();
          return false;
        })
        .map((a) => ({
          question_id: a.question_id,
          scale_value: a.question_type === "scale" ? a.scale_value : undefined,
          open_text: a.question_type === "open" ? a.open_text : undefined,
        }));

      const { error: submitError } = await diagnosticService.submitResponses(
        user.id,
        responsesToSave
      );
      if (submitError) throw new Error("Error guardando respuestas");

      // Step 2: Calculate scores and save snapshot
      const scaleAnswers = diagnosticStore.getAllScaleAnswers();
      const { data: snapshot, error: snapError } =
        await diagnosticService.calculateAndSaveSnapshot(user.id, scaleAnswers);
      if (snapError || !snapshot) throw new Error("Error calculando puntajes");

      // Step 3: Get segment averages for comparison
      const birthYear = profile.birth_year || 1990;
      const generation = diagnosticService.getGeneration(birthYear);
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;

      const { data: segments } = await diagnosticService.getSegmentAverages(
        profile.gender || "Otro",
        generation,
        !!profile.has_partner,
        !!profile.has_children
      );

      // Save segment comparison to snapshot if available
      if (segments && segments.length > 0) {
        const segmentMap: Record<string, { avg_score: number; sample_size: number }> = {};
        for (const s of segments) {
          segmentMap[s.area_code] = {
            avg_score: Number(s.avg_score),
            sample_size: s.sample_size,
          };
        }
        // Update snapshot with segment data
        const { supabase } = await import("@/lib/supabase");
        await supabase
          .from("diagnostic_snapshots")
          .update({ segment_comparison: segmentMap })
          .eq("id", snapshot.id);
      }

      // Step 4: Build answers map for AI analysis
      const areas = diagnosticStore.areas;
      const answersMap: Record<
        string,
        { scale: number[]; openText: string; average: number }
      > = {};

      for (const areaGroup of areas) {
        const code = areaGroup.area.code;
        const scaleValues: number[] = [];
        let openText = "";

        for (const q of areaGroup.questions) {
          const answer = diagnosticStore.answers[q.id];
          if (q.question_type === "scale" && answer?.scale_value) {
            scaleValues.push(answer.scale_value);
          } else if (q.question_type === "open") {
            openText = answer?.open_text || "";
          }
        }

        const avg =
          scaleValues.length > 0
            ? scaleValues.reduce((a, b) => a + b, 0) / scaleValues.length
            : 0;

        answersMap[code] = {
          scale: scaleValues,
          openText,
          average: avg,
        };
      }

      // Step 5: Call OpenAI for analysis + goal suggestions
      const { data: aiResult, error: aiError } =
        await aiService.analyzeAndSuggestGoals({
          gender: profile.gender || "No especificado",
          age,
          hasPartner: !!profile.has_partner,
          hasChildren: !!profile.has_children,
          answers: answersMap,
        });

      // Save AI results to snapshot (non-blocking if fails)
      if (aiResult) {
        await supabase
          .from("diagnostic_snapshots")
          .update({
            area_analyses: aiResult.area_analyses,
            global_diagnosis: JSON.stringify({
              summary: aiResult.global_summary,
              patterns: aiResult.patterns,
              root_causes: aiResult.root_causes,
            }),
            strengths_weaknesses: JSON.stringify({
              strengths: aiResult.strengths,
              weaknesses: aiResult.weaknesses,
            }),
          })
          .eq("id", snapshot.id);
      } else if (aiError) {
        console.warn("AI analysis error (non-blocking):", aiError);
      }

      // Step 6: Create cycle and prepare goal suggestions
      const { data: cycle } = await planService.createCycle(
        user.id,
        snapshot.id
      );

      if (cycle) {
        usePlanStore.getState().setCycle({ ...cycle, goals: [] });
      }

      // Pass suggested goals for later use
      if (aiResult?.suggested_goals) {
        const lifeAreasList = areas.map((a) => a.area);
        setSuggestedGoals(aiResult.suggested_goals, lifeAreasList);
      }

      // Done — clean up and navigate to results first
      diagnosticStore.reset();
      router.replace("/(diagnostic)/results");
    } catch (err) {
      setError((err as Error).message || "Error procesando el diagnostico");
    }
  }

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (error) {
    return (
      <Screen centered>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>{"\u26A0\uFE0F"}</Text>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <View style={styles.retryContainer}>
            <Text
              style={styles.retryText}
              onPress={() => {
                setError(null);
                processingStarted.current = false;
                runProcessing();
              }}
            >
              Reintentar
            </Text>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen centered>
      <View style={styles.centerContainer}>
        <Animated.Text
          style={[
            styles.spinnerIcon,
            { transform: [{ rotate: spin }] },
          ]}
        >
          {"\u2728"}
        </Animated.Text>
        <Text style={styles.processingTitle}>Procesando diagnostico</Text>
        <Text style={styles.processingMessage}>{message}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: SPACING.xl,
  },
  errorTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  errorMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  retryContainer: {
    marginTop: SPACING.lg,
    width: "100%",
  },
  retryText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  spinnerIcon: {
    fontSize: 56,
    marginBottom: SPACING.xl,
  },
  processingTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  processingMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
