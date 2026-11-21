import { z } from 'zod';
import { PASSWORD_REQUIREMENTS, PASSWORD_RULES, USERNAME_RULES, byteLength } from './userRules';

export const registerSchema = z.object({
  username: z.string()
    .trim()
    .min(1, "front/validation:required")
    .min(USERNAME_RULES.minLength, "front/users:validation.usernameMin")
    .max(USERNAME_RULES.maxLength, "front/users:validation.usernameMax")
    .regex(USERNAME_RULES.pattern, "front/users:validation.usernamePattern"),
  password: z.string()
    .min(1, "front/validation:required")
    .refine((value) => byteLength(value) <= PASSWORD_RULES.maxBytes, "front/users:validation.passwordMaxBytes")
    .refine((value) => PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(value)), "front/users:validation.passwordMissing"),
  confirmPassword: z.string().min(1, "front/users:validation.confirmPassword"),
}).refine(data => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "front/users:validation.passwordsMismatch",
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterPayload = Omit<RegisterFormData, "confirmPassword">;
