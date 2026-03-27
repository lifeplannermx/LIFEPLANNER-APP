import { supabase } from "@/lib/supabase";
import type {
  DiagnosticQuestion,
  LifeArea,
  AreaQuestions,
  AreaScore,
  DiagnosticSnapshot,
} from "@/types/diagnostic";

export async function getLifeAreas() {
  const { data, error } = await supabase
    .from("life_areas")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return { data: data as LifeArea[] | null, error };
}

export async function getDiagnosticQuestions() {
  const { data, error } = await supabase
    .from("diagnostic_questions")
    .select("*, life_areas(*)")
    .eq("is_active", true)
    .order("sort_order");

  return { data: data as DiagnosticQuestion[] | null, error };
}

export async function getGroupedQuestions(): Promise<{
  data: AreaQuestions[] | null;
  error: Error | null;
}> {
  const [areasResult, questionsResult] = await Promise.all([
    getLifeAreas(),
    getDiagnosticQuestions(),
  ]);

  if (areasResult.error) return { data: null, error: areasResult.error };
  if (questionsResult.error) return { data: null, error: questionsResult.error };

  const areas = areasResult.data ?? [];
  const questions = questionsResult.data ?? [];

  const grouped: AreaQuestions[] = areas.map((area) => ({
    area,
    questions: questions
      .filter((q) => q.life_area_id === area.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  return { data: grouped, error: null };
}

export async function submitResponses(
  userId: string,
  answers: Array<{
    question_id: string;
    scale_value?: number;
    open_text?: string;
  }>
) {
  const rows = answers.map((a) => ({
    user_id: userId,
    question_id: a.question_id,
    scale_value: a.scale_value ?? null,
    open_text: a.open_text ?? null,
  }));

  const { data, error } = await supabase
    .from("diagnostic_responses")
    .upsert(rows, { onConflict: "user_id,question_id" })
    .select();

  return { data, error };
}

export async function calculateAndSaveSnapshot(
  userId: string,
  answers: Array<{
    question_id: string;
    scale_value?: number;
    life_area_code: string;
    life_area_name: string;
  }>
): Promise<{ data: DiagnosticSnapshot | null; error: Error | null }> {
  const scoresByArea: Record<string, { total: number; count: number; name: string }> = {};

  for (const answer of answers) {
    if (answer.scale_value == null) continue;
    const code = answer.life_area_code;
    if (!scoresByArea[code]) {
      scoresByArea[code] = { total: 0, count: 0, name: answer.life_area_name };
    }
    scoresByArea[code].total += answer.scale_value;
    scoresByArea[code].count += 1;
  }

  const scores: Record<string, AreaScore> = {};
  let totalPercentage = 0;
  let areaCount = 0;

  for (const [code, data] of Object.entries(scoresByArea)) {
    const maxScore = data.count * 5;
    const percentage = Math.round((data.total / maxScore) * 100);
    scores[code] = {
      area_code: code,
      area_name: data.name,
      score: data.total,
      max_score: maxScore,
      percentage,
    };
    totalPercentage += percentage;
    areaCount += 1;
  }

  const overallScore = areaCount > 0
    ? Math.round((totalPercentage / areaCount) * 10) / 10
    : 0;

  const { data, error } = await supabase
    .from("diagnostic_snapshots")
    .insert({
      user_id: userId,
      scores,
      overall_score: overallScore,
    })
    .select()
    .single();

  return { data: data as DiagnosticSnapshot | null, error };
}

export async function getLatestSnapshot(userId: string) {
  const { data, error } = await supabase
    .from("diagnostic_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { data: data as DiagnosticSnapshot | null, error };
}

export async function getUserResponses(userId: string) {
  const { data, error } = await supabase
    .from("diagnostic_responses")
    .select("*")
    .eq("user_id", userId);

  return { data, error };
}

// ── AI Analysis (Edge Functions) ────────────────────────────────────

export async function requestAIAnalysis(
  snapshotId: string,
  userId: string,
  profile: {
    gender: string;
    age: number;
    has_partner: boolean;
    has_children: boolean;
  },
  answers: Record<
    string,
    { scale: number[]; openText: string; average: number }
  >
) {
  const { data, error } = await supabase.functions.invoke(
    "diagnostic-analyze",
    {
      body: {
        snapshot_id: snapshotId,
        user_id: userId,
        gender: profile.gender,
        age: profile.age,
        has_partner: profile.has_partner,
        has_children: profile.has_children,
        answers,
      },
    }
  );

  return { data, error };
}

export async function requestActionPlan(
  snapshotId: string,
  userId: string
) {
  const { data, error } = await supabase.functions.invoke(
    "diagnostic-plan",
    {
      body: {
        snapshot_id: snapshotId,
        user_id: userId,
      },
    }
  );

  return { data, error };
}

// ── Segment comparison ──────────────────────────────────────────────

export interface SegmentAverage {
  area_code: string;
  avg_score: number;
  sample_size: number;
  segment_label: string;
}

export async function getSegmentAverages(
  gender: string,
  generation: string,
  hasPartner: boolean,
  hasChildren: boolean
): Promise<{ data: SegmentAverage[] | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("get_segment_averages", {
    p_gender: gender,
    p_generation: generation,
    p_has_partner: hasPartner,
    p_has_children: hasChildren,
    p_min_sample: 30,
  });

  return { data: data as SegmentAverage[] | null, error };
}

// Helper: get generation from birth year
export function getGeneration(birthYear: number): string {
  if (birthYear >= 1997) return "Gen Z";
  if (birthYear >= 1981) return "Millennial";
  if (birthYear >= 1965) return "Gen X";
  if (birthYear >= 1946) return "Boomer";
  return "Silent";
}
