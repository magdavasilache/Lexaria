import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(1, "The username is required!"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#\$%\^&\*\?_]/, "Password must contain at least one special character (!, @, #, ?, etc.)"),
  confirmPassword: z.string().min(1, "Confirming the password is required!"),
}).refine(data => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match!",
});

export type RegisterFormData = z.infer<typeof registerSchema>;
