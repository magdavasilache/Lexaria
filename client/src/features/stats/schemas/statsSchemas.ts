import { z } from "zod";
import { CHALLENGE_RULES } from "./statsRules";

export const CHALLENGE_TARGET_REQUIRED = "front/stats:validation.targetRequired";

const target = (max: number, message: string) =>
  z.number().int(message).min(CHALLENGE_RULES.targetMin, message).max(max, message).nullable();

export const challengeSchema = z
  .object({
    books: target(CHALLENGE_RULES.booksMax, "front/stats:validation.booksRange"),
    pages: target(CHALLENGE_RULES.pagesMax, "front/stats:validation.pagesRange"),
    hours: target(CHALLENGE_RULES.hoursMax, "front/stats:validation.hoursRange"),
  })
  .superRefine((values, context) => {
    if (values.books === null && values.pages === null && values.hours === null) {
      for (const path of ["books", "pages", "hours"] as const) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: CHALLENGE_TARGET_REQUIRED });
      }
    }
  });

export type ChallengeValues = z.infer<typeof challengeSchema>;
