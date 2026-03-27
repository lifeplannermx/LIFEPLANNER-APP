import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ScaleInput } from "@/components/diagnostic/ScaleInput";
import { ProgressBar } from "@/components/diagnostic/ProgressBar";
import { useDiagnosticStore } from "@/lib/stores/diagnostic.store";
import { useSessionStore } from "@/lib/stores/session.store";
import * as diagnosticService from "@/lib/api/diagnostic.service";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";

const AREA_ICONS: Record<string, string> = {
  financial: "\uD83D\uDCB0",
  health: "\u2764\uFE0F",
  family: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67",
  relationship: "\uD83D\uDC9C",
  spiritual: "\uD83D\uDE4F",
  professional: "\uD83D\uDCBC",
  social: "\uD83E\uDD1D",
  leisure: "\uD83C\uDFAE",
};

export default function DiagnosticTestScreen() {
  const { area } = useLocalSearchParams<{ area: string }>();
  const areaIndex = parseInt(area, 10) - 1;

  const {
    areas,
    setAreas,
    answers,
    setAnswer,
    isAreaComplete,
    isSubmitting,
    setIsSubmitting,
  } = useDiagnosticStore();

  const user = useSessionStore((s) => s.user);
  const [loading, setLoading] = useState(areas.length === 0);

  useEffect(() => {
    if (areas.length === 0) {
      loadQuestions();
    }
  }, []);

  async function loadQuestions() {
    setLoading(true);
    const { data, error } = await diagnosticService.getGroupedQuestions();
    if (error || !data) {
      Alert.alert("Error", "No se pudieron cargar las preguntas.");
      router.back();
      return;
    }
    setAreas(data);
    setLoading(false);
  }

  if (loading || areas.length === 0) {
    return (
      <Screen centered>
        <LoadingState message="Cargando preguntas..." />
      </Screen>
    );
  }

  const currentArea = areas[areaIndex];
  if (!currentArea) {
    router.replace("/(diagnostic)/intro");
    return null;
  }

  const { area: lifeArea, questions } = currentArea;
  const totalAreas = areas.length;
  const isLast = areaIndex === totalAreas - 1;
  const canContinue = isAreaComplete(areaIndex);
  const icon = AREA_ICONS[lifeArea.code] ?? "\u2B50";

  async function handleNext() {
    if (isLast) {
      await handleSubmit();
    } else {
      router.push(`/(diagnostic)/test/${areaIndex + 2}`);
    }
  }

  function handleSubmit() {
    // All saving happens in processing screen — just navigate
    router.replace("/(diagnostic)/processing");
  }

  function handleBack() {
    if (areaIndex > 0) {
      router.back();
    } else {
      router.back();
    }
  }

  return (
    <Screen scroll keyboardAvoiding>
      <View style={styles.wrapper}>
        <ProgressBar
          current={areaIndex + 1}
          total={totalAreas}
          areaName={`${icon} ${lifeArea.name}`}
        />

        {questions.map((q, idx) => {
          const answer = answers[q.id];

          if (q.question_type === "scale") {
            return (
              <View key={q.id} style={styles.card}>
                <Text style={styles.questionNumber}>{idx + 1}.</Text>
                <Text style={styles.questionText}>{q.prompt}</Text>
                <ScaleInput
                  value={answer?.scale_value}
                  onChange={(value) =>
                    setAnswer({
                      question_id: q.id,
                      question_type: "scale",
                      scale_value: value,
                      life_area_code: lifeArea.code,
                      life_area_name: lifeArea.name,
                    })
                  }
                  min={q.scale_min ?? 1}
                  max={q.scale_max ?? 5}
                />
              </View>
            );
          }

          return (
            <View key={q.id} style={styles.card}>
              <Text style={styles.questionNumber}>{idx + 1}.</Text>
              <Text style={styles.questionText}>{q.prompt}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Escribe tu respuesta aqui... (opcional)"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={answer?.open_text ?? ""}
                onChangeText={(text) =>
                  setAnswer({
                    question_id: q.id,
                    question_type: "open",
                    open_text: text,
                    life_area_code: lifeArea.code,
                    life_area_name: lifeArea.name,
                  })
                }
              />
            </View>
          );
        })}

        <View style={styles.buttonsRow}>
          <Button
            title="Atras"
            variant="outline"
            onPress={handleBack}
            style={{ flex: 1 }}
          />
          <Button
            title={isLast ? "Finalizar" : "Siguiente"}
            onPress={handleNext}
            disabled={!canContinue}
            loading={isSubmitting}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionNumber: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  questionText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  textInput: {
    marginTop: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    minHeight: 100,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
});
