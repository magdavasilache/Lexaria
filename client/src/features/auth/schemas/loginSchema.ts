import { z } from 'zod';
import { PASSWORD_RULES, USERNAME_RULES } from './userRules';

export const loginSchema = z.object({
    username: z.string()
        .trim()
        .min(1, "front/validation:required")
        .max(USERNAME_RULES.maxLength, "front/users:validation.usernameMax"),
    password: z.string()
        .min(1, "front/validation:required")
        .max(PASSWORD_RULES.loginMaxLength, "front/users:validation.loginPasswordMax"),
    remember_me: z.boolean(),
})

export type LoginFormData = z.infer<typeof loginSchema>;
