import { z } from "zod";
import { BAN_RULES } from "./userRules";

export const PERMANENT_BAN = "permanent";

export const banSchema = z.object({
    reason: z.string()
        .trim()
        .min(1, "front/validation:required")
        .max(BAN_RULES.reasonMaxLength, "front/users:ban.validation.reasonMax"),
    duration: z.string().refine(
        (value) => value === PERMANENT_BAN || (Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= BAN_RULES.durationDaysMax),
        "front/users:ban.validation.duration",
    ),
});

export type BanFormValues = z.infer<typeof banSchema>;
