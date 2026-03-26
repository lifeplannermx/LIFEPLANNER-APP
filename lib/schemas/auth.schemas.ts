import { z } from "zod";
import { LIMITS } from "@/constants/limits";

export const RegisterInputSchema = z.object({
  email: z.string().email("Email no valido"),
  password: z
    .string()
    .min(LIMITS.PASSWORD_MIN_LENGTH, `Minimo ${LIMITS.PASSWORD_MIN_LENGTH} caracteres`),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contrasenas no coinciden",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email("Email no valido"),
  password: z.string().min(1, "Contrasena requerida"),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email("Email no valido"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;
