import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { RadarChart } from "@/components/diagnostic/RadarChart";
import { useSessionStore } from "@/lib/stores/session.store";
import * as diagnosticService from "@/lib/api/diagnostic.service";
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from "@/constants/app";
import type { DiagnosticSnapshot, AreaScore } from "@/types/diagnostic";

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

const AREA_ORDER = [
  "financial", "health", "family", "relationship",
  "spiritual", "professional", "social", "leisure",
];

type Tab = "radar" | "areas" | "plan";

type RelativeLevel = {
  label: string;
  color: string;
  message: string;
};

function getScoreColor(percentage: number): string {
  if (percentage >= 80) return COLORS.success;
  if (percentage >= 60) return "#84CC16";
  if (percentage >= 40) return COLORS.warning;
  return COLORS.danger;
}

function getRelativeLevel(
  userAvg: number,
  segmentAvg: number | null
): RelativeLevel {
  if (segmentAvg == null) {
    // No segment data — use absolute thresholds
    if (userAvg >= 4) return { label: "Destacado", color: COLORS.success, message: "Tienes una base solida en la mayoria de tus areas. Este es el momento de potenciar lo que ya haces bien." };
    if (userAvg >= 3) return { label: "En equilibrio", color: "#84CC16", message: "Estas en un buen punto de partida. Con pequenos ajustes consistentes, puedes lograr cambios significativos." };
    if (userAvg >= 2) return { label: "En crecimiento", color: COLORS.warning, message: "Reconocer donde estas es el primer paso. Ya tienes la motivacion para mejorar y eso es lo mas importante." };
    return { label: "Gran oportunidad", color: COLORS.primary, message: "Tienes mucho espacio para crecer, y eso es una ventaja. Cada pequeno cambio sumara a tu favor." };
  }

  const diff = ((userAvg - segmentAvg) / segmentAvg) * 100;

  if (diff >= 10) return { label: "Destacado", color: COLORS.success, message: "Estas por encima del promedio de personas similares a ti. Sigue asi y enfocate en mantener tu ritmo." };
  if (diff >= -5) return { label: "En equilibrio", color: "#84CC16", message: "Estas al nivel de personas con un perfil similar al tuyo, con areas claras donde puedes destacar aun mas." };
  if (diff >= -15) return { label: "En crecimiento", color: COLORS.warning, message: "Estas cerca del promedio de tu segmento. Con habitos simples y constantes, puedes superarlo rapidamente." };
  return { label: "Gran oportunidad", color: COLORS.primary, message: "Tienes un gran margen de mejora comparado con personas similares. Cada paso que des te acercara a donde quieres estar." };
}

const MOTIVATIONAL_PHRASES = [
  "El progreso, no la perfeccion, es lo que importa.",
  "Cada dia es una nueva oportunidad para ser mejor que ayer.",
  "No se trata de donde empiezas, sino de hacia donde te diriges.",
  "Los pequenos cambios diarios crean grandes transformaciones.",
  "Tu potencial no tiene limite, solo necesita direccion.",
  "El mejor momento para empezar fue ayer. El segundo mejor es ahora.",
  "Crecer no es lineal, y eso esta bien.",
  "La constancia supera al talento cuando el talento no es constante.",
  "Cada paso cuenta, incluso los mas pequenos.",
  "Invertir en ti es la mejor decision que puedes tomar.",
];

function getMotivationalPhrase(): string {
  // Rotate based on day of year so it changes daily
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_PHRASES[dayOfYear % MOTIVATIONAL_PHRASES.length];
}

export default function DiagnosticResultsScreen() {
  const user = useSessionStore((s) => s.user);
  const setBootstrapState = useSessionStore((s) => s.setBootstrapState);
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("radar");
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    if (!user) return;
    const { data } = await diagnosticService.getLatestSnapshot(user.id);
    setSnapshot(data);
    setLoading(false);
  }

  function handleContinue() {
    // Go to AI-suggested goals (cycle was already created in processing)
    router.replace("/(plan)/suggested-goals");
  }

  if (loading) {
    return (
      <Screen centered>
        <LoadingState message="Cargando resultados..." />
      </Screen>
    );
  }

  if (!snapshot) {
    return (
      <Screen centered>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sin resultados</Text>
          <Button
            title="Volver al inicio"
            onPress={() => router.replace("/(diagnostic)/intro")}
          />
        </View>
      </Screen>
    );
  }

  const scores = snapshot.scores || {};
  const segmentData = snapshot.segment_comparison;

  // Calculate user average (1-5 scale)
  const scoreValues = AREA_ORDER.map((code) => scores[code]).filter(Boolean);
  const userAvg = scoreValues.length > 0
    ? scoreValues.reduce((sum, s) => sum + s!.score / s!.max_score * 5, 0) / scoreValues.length
    : 0;

  // Calculate segment average (1-5 scale)
  const segmentAvg = segmentData
    ? AREA_ORDER.reduce((sum, code) => sum + (segmentData[code]?.avg_score ?? 0), 0) / AREA_ORDER.length
    : null;

  const level = getRelativeLevel(userAvg, segmentAvg);
  const phrase = getMotivationalPhrase();

  const radarData = AREA_ORDER.map((code) => {
    const s = scores[code];
    const segAvgArea = segmentData?.[code]?.avg_score;
    return {
      label: s?.area_name || code,
      value: s ? (s.score / s.max_score) * 5 : 0,
      segmentValue: segAvgArea != null ? segAvgArea : undefined,
    };
  });

  const segmentLabel = segmentData ? "Promedio de tu segmento" : undefined;

  const sortedScores = AREA_ORDER
    .map((code) => scores[code])
    .filter((s): s is AreaScore => !!s);

  return (
    <Screen scroll>
      <View style={styles.wrapper}>
        {/* Header */}
        <Text style={styles.headerIcon}>{"\uD83D\uDCCA"}</Text>
        <Text style={styles.headerTitle}>Tu diagnostico</Text>
        <Text style={styles.headerSubtitle}>
          Asi estas en las 8 areas de tu vida
        </Text>

        {/* Relative level card */}
        <View style={[styles.levelCard, { borderLeftColor: level.color }]}>
          <Text style={[styles.levelLabel, { color: level.color }]}>
            {level.label}
          </Text>
          <Text style={styles.levelMessage}>{level.message}</Text>
        </View>

        {/* Motivational phrase */}
        <View style={styles.phraseCard}>
          <Text style={styles.phraseText}>{"\u201C"}{phrase}{"\u201D"}</Text>
        </View>

        {/* Strengths / Weaknesses */}
        {snapshot.strengths_weaknesses && (() => {
          let sw: { strengths?: string[]; weaknesses?: string[] } = {};
          try {
            sw = typeof snapshot.strengths_weaknesses === "string"
              ? JSON.parse(snapshot.strengths_weaknesses)
              : snapshot.strengths_weaknesses;
          } catch {
            return null;
          }
          return (
            <View style={styles.swCard}>
              {sw.strengths && sw.strengths.length > 0 && (
                <View style={styles.swSection}>
                  <Text style={styles.swTitle}>Tus fortalezas</Text>
                  {sw.strengths.map((s, i) => (
                    <View key={`s-${i}`} style={styles.swRow}>
                      <View style={[styles.swDot, { backgroundColor: COLORS.success }]} />
                      <Text style={styles.swText}>{s}</Text>
                    </View>
                  ))}
                </View>
              )}
              {sw.weaknesses && sw.weaknesses.length > 0 && (
                <View style={styles.swSection}>
                  <Text style={styles.swTitle}>Areas de oportunidad</Text>
                  {sw.weaknesses.map((w, i) => (
                    <View key={`w-${i}`} style={styles.swRow}>
                      <View style={[styles.swDot, { backgroundColor: COLORS.warning }]} />
                      <Text style={styles.swText}>{w}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })()}

        {/* Tab selector */}
        <View style={styles.tabBar}>
          {([
            { key: "radar" as Tab, label: "Radar" },
            { key: "areas" as Tab, label: "Areas" },
            { key: "plan" as Tab, label: "Plan" },
          ]).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive ? styles.tabTextActive : styles.tabTextInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab content */}
        {activeTab === "radar" && (
          <View style={styles.fullWidth}>
            <RadarChart data={radarData} segmentLabel={segmentLabel} />

            {/* Score bars */}
            <View style={styles.scoreBarsContainer}>
              {sortedScores.map((score) => {
                const icon = AREA_ICONS[score.area_code] ?? "\u2B50";
                const color = getScoreColor(score.percentage);
                const segAvg = segmentData?.[score.area_code]?.avg_score;
                return (
                  <View key={score.area_code} style={styles.scoreBarRow}>
                    <Text style={styles.scoreBarIcon}>{icon}</Text>
                    <View style={styles.scoreBarContent}>
                      <View style={styles.scoreBarHeader}>
                        <Text style={styles.scoreBarName}>
                          {score.area_name}
                        </Text>
                        <View style={styles.scoreBarValues}>
                          <Text style={[styles.scoreBarValue, { color }]}>
                            {score.percentage}%
                          </Text>
                          {segAvg != null && (
                            <Text style={styles.scoreBarSegment}>
                              vs {Math.round((segAvg / 5) * 100)}%
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.scoreBarTrack}>
                        <View
                          style={[
                            styles.scoreBarFill,
                            {
                              width: `${score.percentage}%`,
                              backgroundColor: color,
                            },
                          ]}
                        />
                        {segAvg != null && (
                          <View
                            style={[
                              styles.scoreBarMarker,
                              {
                                left: `${Math.round((segAvg / 5) * 100)}%`,
                              },
                            ]}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === "areas" && (
          <View style={styles.fullWidth}>
            {/* Global diagnosis */}
            {snapshot.global_diagnosis && (() => {
              let gd: { summary?: string; patterns?: string[]; root_causes?: string[] } = {};
              try {
                gd = typeof snapshot.global_diagnosis === "string"
                  ? JSON.parse(snapshot.global_diagnosis)
                  : snapshot.global_diagnosis;
              } catch {
                // Fallback: plain text
                return (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Diagnostico global</Text>
                    <Text style={styles.cardBodyText}>{snapshot.global_diagnosis}</Text>
                  </View>
                );
              }
              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Diagnostico global</Text>
                  {gd.summary && (
                    <Text style={styles.cardBodyText}>{gd.summary}</Text>
                  )}
                  {gd.patterns && gd.patterns.length > 0 && (
                    <View style={styles.gdSection}>
                      <Text style={styles.gdSectionTitle}>Patrones detectados</Text>
                      {gd.patterns.map((p, i) => (
                        <View key={`p-${i}`} style={styles.gdRow}>
                          <View style={[styles.swDot, { backgroundColor: COLORS.secondary }]} />
                          <Text style={styles.gdRowText}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {gd.root_causes && gd.root_causes.length > 0 && (
                    <View style={styles.gdSection}>
                      <Text style={styles.gdSectionTitle}>Causas raiz</Text>
                      {gd.root_causes.map((c, i) => (
                        <View key={`c-${i}`} style={styles.gdRow}>
                          <View style={[styles.swDot, { backgroundColor: COLORS.warning }]} />
                          <Text style={styles.gdRowText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })()}

            {/* Individual area analyses */}
            {AREA_ORDER.map((code) => {
              const rawAnalysis = snapshot.area_analyses?.[code];
              const score = scores[code];
              if (!rawAnalysis) return null;
              const icon = AREA_ICONS[code] ?? "\u2B50";
              const isExpanded = expandedArea === code;

              // Parse structured analysis
              let analysis: { interpretation?: string; diagnosis?: string; recommendations?: string[] } = {};
              if (typeof rawAnalysis === "string") {
                // Legacy plain text
                analysis = { diagnosis: rawAnalysis };
              } else {
                analysis = rawAnalysis as typeof analysis;
              }

              return (
                <TouchableOpacity
                  key={code}
                  onPress={() => setExpandedArea(isExpanded ? null : code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.areaCard}>
                    <View style={styles.areaCardHeader}>
                      <Text style={styles.areaCardIcon}>{icon}</Text>
                      <Text style={styles.areaCardName}>
                        {score?.area_name || code}
                      </Text>
                      <Text
                        style={[
                          styles.areaCardScore,
                          { color: getScoreColor(score?.percentage ?? 0) },
                        ]}
                      >
                        {score?.percentage ?? 0}%
                      </Text>
                      <Text style={styles.areaCardChevron}>
                        {isExpanded ? "\u25B2" : "\u25BC"}
                      </Text>
                    </View>
                    {isExpanded && (
                      <View style={styles.areaCardBody}>
                        {analysis.interpretation && (
                          <Text style={styles.areaBodyText}>
                            {analysis.interpretation}
                          </Text>
                        )}
                        {analysis.diagnosis && (
                          <View style={styles.areaBodySection}>
                            <Text style={styles.areaBodyLabel}>Diagnostico</Text>
                            <Text style={styles.areaBodyText}>
                              {analysis.diagnosis}
                            </Text>
                          </View>
                        )}
                        {analysis.recommendations && analysis.recommendations.length > 0 && (
                          <View style={styles.areaBodySection}>
                            <Text style={styles.areaBodyLabel}>Recomendaciones</Text>
                            {analysis.recommendations.map((r, i) => (
                              <View key={i} style={styles.recRow}>
                                <Text style={styles.recNumber}>{i + 1}</Text>
                                <Text style={styles.recText}>{r}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeTab === "plan" && (
          <View style={styles.fullWidth}>
            {snapshot.action_plan ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Tu plan de accion</Text>
                <Text style={styles.cardBodyText}>
                  {snapshot.action_plan}
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardBodyText}>
                  El plan de accion se esta generando. Vuelve en un momento.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Continue button */}
        <View style={styles.continueContainer}>
          <Button title="Ver metas sugeridas" onPress={handleContinue} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    width: "100%",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: "100%",
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
  },
  levelLabel: {
    fontSize: FONT_SIZE.xl,
    fontWeight: "800",
    marginBottom: SPACING.xs,
  },
  levelMessage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  phraseCard: {
    width: "100%",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: "center",
  },
  phraseText: {
    fontSize: FONT_SIZE.sm,
    fontStyle: "italic",
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    alignSelf: "flex-start",
  },
  cardBodyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
    alignSelf: "flex-start",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 3,
    width: "100%",
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    borderRadius: BORDER_RADIUS.sm,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
  },
  tabTextActive: {
    color: COLORS.textInverse,
  },
  tabTextInactive: {
    color: COLORS.textSecondary,
  },
  fullWidth: {
    width: "100%",
  },
  scoreBarsContainer: {
    width: "100%",
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  scoreBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  scoreBarIcon: {
    fontSize: 22,
    width: 30,
    textAlign: "center",
  },
  scoreBarContent: {
    flex: 1,
  },
  scoreBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  scoreBarName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  scoreBarValues: {
    flexDirection: "row",
    gap: SPACING.sm,
    alignItems: "center",
  },
  scoreBarValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
  },
  scoreBarSegment: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
    position: "relative",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.full,
  },
  scoreBarMarker: {
    position: "absolute",
    width: 2,
    height: 10,
    backgroundColor: COLORS.textMuted,
    borderRadius: 1,
    top: -1,
  },
  areaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  areaCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  areaCardIcon: {
    fontSize: FONT_SIZE.xl,
  },
  areaCardName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  areaCardScore: {
    fontSize: FONT_SIZE.md,
    fontWeight: "700",
  },
  areaCardChevron: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
  areaCardAnalysis: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  emptyContainer: {
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  continueContainer: {
    width: "100%",
    marginTop: SPACING.lg,
  },
  gdSection: {
    marginTop: SPACING.md,
  },
  gdSectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  gdRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  gdRowText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  areaCardBody: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  areaBodySection: {
    marginTop: SPACING.xs,
  },
  areaBodyLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  areaBodyText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  recRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  recNumber: {
    fontSize: FONT_SIZE.xs,
    fontWeight: "700",
    color: COLORS.primary,
    width: 16,
    textAlign: "center",
    marginTop: 1,
  },
  recText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  swCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: "100%",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.lg,
  },
  swSection: {
    gap: SPACING.sm,
  },
  swTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  swRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  swDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  swText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
