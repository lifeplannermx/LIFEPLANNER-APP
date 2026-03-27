import { z } from "zod";

export const scaleAnswerSchema = z.object({
  question_id: z.string().uuid(),
  scale_value: z.number().int().min(1).max(5),
});

export const openAnswerSchema = z.object({
  question_id: z.string().uuid(),
  open_text: z.string().min(1).max(2000),
});

export const diagnosticAnswerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("scale"), question_id: z.string().uuid(), scale_value: z.number().int().min(1).max(5) }),
  z.object({ type: z.literal("open"), question_id: z.string().uuid(), open_text: z.string().max(2000) }),
]);

export type ScaleAnswer = z.infer<typeof scaleAnswerSchema>;
export type OpenAnswer = z.infer<typeof openAnswerSchema>;
export type DiagnosticAnswer = z.infer<typeof diagnosticAnswerSchema>;
