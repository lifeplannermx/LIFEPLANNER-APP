export type QuestionType = "scale" | "open";

export interface LifeArea {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface DiagnosticQuestion {
  id: string;
  life_area_id: string;
  question_type: QuestionType;
  prompt: string;
  scale_min: number | null;
  scale_max: number | null;
  sort_order: number;
  is_active: boolean;
  life_areas?: LifeArea;
}

export interface DiagnosticResponse {
  id: string;
  user_id: string;
  question_id: string;
  scale_value: number | null;
  open_text: string | null;
  created_at: string;
}

export interface AreaScore {
  area_code: string;
  area_name: string;
  score: number;
  max_score: number;
  percentage: number;
}

export interface DiagnosticSnapshot {
  id: string;
  user_id: string;
  scores: Record<string, AreaScore>;
  overall_score: number | null;
  ai_summary: string | null;
  area_analyses: Record<string, string> | null;
  global_diagnosis: string | null;
  action_plan: string | null;
  strengths_weaknesses: string | null;
  segment_comparison: Record<string, { avg_score: number; sample_size: number }> | null;
  completed_at: string;
  created_at: string;
}

export interface AreaQuestions {
  area: LifeArea;
  questions: DiagnosticQuestion[];
}
