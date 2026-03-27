import { create } from "zustand";
import type { AreaQuestions } from "@/types/diagnostic";

interface AnswerEntry {
  question_id: string;
  question_type: "scale" | "open";
  scale_value?: number;
  open_text?: string;
  life_area_code: string;
  life_area_name: string;
}

interface DiagnosticState {
  areas: AreaQuestions[];
  currentAreaIndex: number;
  answers: Record<string, AnswerEntry>;
  isSubmitting: boolean;

  setAreas: (areas: AreaQuestions[]) => void;
  setCurrentAreaIndex: (index: number) => void;
  setAnswer: (entry: AnswerEntry) => void;
  setIsSubmitting: (v: boolean) => void;
  getAreaAnswers: (areaIndex: number) => AnswerEntry[];
  isAreaComplete: (areaIndex: number) => boolean;
  getAllScaleAnswers: () => AnswerEntry[];
  getAllAnswers: () => AnswerEntry[];
  totalAreas: () => number;
  reset: () => void;
}

export const useDiagnosticStore = create<DiagnosticState>((set, get) => ({
  areas: [],
  currentAreaIndex: 0,
  answers: {},
  isSubmitting: false,

  setAreas: (areas) => set({ areas }),
  setCurrentAreaIndex: (currentAreaIndex) => set({ currentAreaIndex }),
  setAnswer: (entry) =>
    set((state) => ({
      answers: { ...state.answers, [entry.question_id]: entry },
    })),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  getAreaAnswers: (areaIndex) => {
    const { areas, answers } = get();
    const area = areas[areaIndex];
    if (!area) return [];
    return area.questions
      .map((q) => answers[q.id])
      .filter((a): a is AnswerEntry => !!a);
  },

  isAreaComplete: (areaIndex) => {
    const { areas, answers } = get();
    const area = areas[areaIndex];
    if (!area) return false;
    return area.questions.every((q) => {
      if (q.question_type === "open") return true; // open questions are always optional
      const answer = answers[q.id];
      return answer != null && answer.scale_value != null;
    });
  },

  getAllScaleAnswers: () => {
    const { answers } = get();
    return Object.values(answers).filter((a) => a.question_type === "scale");
  },

  getAllAnswers: () => {
    const { answers } = get();
    return Object.values(answers);
  },

  totalAreas: () => get().areas.length,

  reset: () =>
    set({
      areas: [],
      currentAreaIndex: 0,
      answers: {},
      isSubmitting: false,
    }),
}));
