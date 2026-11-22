import { z } from "zod";
import { EDITION_FORMATS, PERCENT_FORMATS } from "../../reading/types/editionTypes";
import { EDITION_RULES } from "../../reading/schemas/readingRules";
import { isbnValid } from "../../reading/schemas/readingSchemas";

export const isbnLookupSchema = z.object({
  isbn: z
    .string()
    .trim()
    .min(1, "front/validation:required")
    .max(EDITION_RULES.isbnInputMaxLength, "front/reading:validation.isbnInvalid")
    .refine(isbnValid, "front/reading:validation.isbnInvalid"),
});

export type IsbnLookupValues = z.infer<typeof isbnLookupSchema>;

export const isbnImportSchema = z
  .object({
    format: z.enum(EDITION_FORMATS).nullable(),
    pages: z
      .number()
      .int("front/reading:validation.editionPages")
      .min(1, "front/reading:validation.editionPages")
      .max(EDITION_RULES.pagesMax, "front/reading:validation.editionPages")
      .nullable(),
    include_cover: z.boolean(),
  })
  .superRefine((values, context) => {
    if (values.format === null) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["format"], message: "front/validation:required" });
    } else if (!PERCENT_FORMATS.includes(values.format) && values.pages === null) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["pages"], message: "front/reading:validation.pagesRequired" });
    }
  });

export type IsbnImportValues = z.infer<typeof isbnImportSchema>;
