import { z } from "zod";
import { REVIEW_RULES, today } from "./reviewRules";

const optionalDate = z.string().refine((value) => value === "" || value <= today(), "front/reviews:validation.futureDate");

export const reviewFormSchema = z
  .object({
    rating: z
      .number()
      .min(REVIEW_RULES.ratingMin)
      .max(REVIEW_RULES.ratingMax)
      .refine((value) => Number.isInteger(value / REVIEW_RULES.ratingStep), "front/reviews:validation.ratingStep")
      .nullable(),
    content: z.string().trim().max(REVIEW_RULES.contentMaxLength, "front/reviews:validation.contentMax"),
    dates: z
      .object({ from: optionalDate, to: optionalDate })
      .refine(({ from, to }) => !from || !to || from <= to, "front/reviews:validation.dateRange"),
  })
  .refine((values) => values.rating !== null || values.content !== "", {
    path: ["rating"],
    message: "front/reviews:validation.empty",
  });

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export const commentFormSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "front/validation:required")
    .max(REVIEW_RULES.commentMaxLength, "front/reviews:validation.commentMax"),
});

export type CommentFormValues = z.infer<typeof commentFormSchema>;
