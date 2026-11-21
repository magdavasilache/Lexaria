import { z } from "zod";
import { INTENT_TYPES, TRAINING_RULES } from "./chatbotRules";

export const intentFormSchema = z.object({
  tag: z.string().trim().min(1, "front/validation:required"),
  type: z.enum(INTENT_TYPES),
});

export type IntentFormValues = z.infer<typeof intentFormSchema>;

export const patternFormSchema = z.object({
  pattern: z.string().trim().min(1, "front/validation:required"),
});

export type PatternFormValues = z.infer<typeof patternFormSchema>;

export const responseFormSchema = z.object({
  intentId: z
    .number()
    .int()
    .positive()
    .nullable()
    .refine((value) => Boolean(value), "front/validation:required"),
  response: z.string().trim().min(1, "front/validation:required"),
});

export type ResponseFormValues = z.infer<typeof responseFormSchema>;

export const trainingFormSchema = z.object({
  epochs: z
    .number()
    .int("front/admin:chatbot.training.epochsInteger")
    .min(TRAINING_RULES.epochsMin, "front/admin:chatbot.training.epochsMin")
    .nullable()
    .refine((value) => Boolean(value), "front/validation:required"),
});

export type TrainingFormValues = z.infer<typeof trainingFormSchema>;
