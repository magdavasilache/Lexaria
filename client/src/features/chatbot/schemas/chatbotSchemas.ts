import { z } from "zod";
import { MB } from "../../books/schemas/bookRules";
import { CHATBOT_RULES, IMPORT_MODES, INTENT_TYPES, RESPONSE_LANGUAGES, normalizeTag } from "./chatbotRules";

const text = (maxLength: number, message: string) =>
  z.string().trim().min(1, "front/validation:required").max(maxLength, message);

export const intentFormSchema = z.object({
  tag: text(CHATBOT_RULES.tagMaxLength, "front/admin:chatbot.validation.tagMax").refine(
    (value) => CHATBOT_RULES.tagPattern.test(normalizeTag(value)),
    "front/admin:chatbot.validation.tagPattern"
  ),
  type: z.enum(INTENT_TYPES),
});

export type IntentFormValues = z.infer<typeof intentFormSchema>;

export const patternFormSchema = z.object({
  pattern: text(CHATBOT_RULES.patternMaxLength, "front/admin:chatbot.validation.patternMax"),
});

export type PatternFormValues = z.infer<typeof patternFormSchema>;

export const responseFormSchema = z.object({
  intentId: z
    .number()
    .int()
    .positive()
    .nullable()
    .refine((value) => Boolean(value), "front/validation:required"),
  language: z.enum(RESPONSE_LANGUAGES),
  response: text(CHATBOT_RULES.responseMaxLength, "front/admin:chatbot.validation.responseMax"),
});

export type ResponseFormValues = z.infer<typeof responseFormSchema>;

export const chatMessageSchema = z.object({
  message: text(CHATBOT_RULES.messageMaxLength, "front/chatbot:validation.messageMax"),
});

export type ChatMessageValues = z.infer<typeof chatMessageSchema>;

const importFileTypes: readonly string[] = CHATBOT_RULES.importFileTypes;

export const intentImportSchema = z.object({
  file: z
    .custom<FileList>((value) => value instanceof FileList)
    .refine((files) => files.length > 0, "front/validation:required")
    .refine(
      (files) =>
        files.length === 0 || (files[0].name.toLowerCase().endsWith(CHATBOT_RULES.importFileExtension) && importFileTypes.includes(files[0].type)),
      "front/admin:chatbot.validation.importType"
    )
    .refine((files) => files.length === 0 || files[0].size <= CHATBOT_RULES.importFileMaxMb * MB, "front/admin:chatbot.validation.importSize"),
  mode: z.enum(IMPORT_MODES),
});

export type IntentImportValues = z.infer<typeof intentImportSchema>;
