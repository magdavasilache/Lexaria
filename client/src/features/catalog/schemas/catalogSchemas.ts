import { z } from "zod";
import { MB } from "../../books/schemas/bookRules";
import { CATALOG_RULES, NAME_MAX_LENGTH, todayIso } from "./catalogRules";
import type { NamedKind } from "../catalogTypes";

const name = (maxLength: number, message: string) =>
  z.string().trim().min(1, "front/validation:required").max(maxLength, message);

export const nameFormSchema = (kind: NamedKind) =>
  z.object({ name: name(NAME_MAX_LENGTH[kind], `front/catalog:validation.${kind}NameMax`) });

export type NameFormValues = z.infer<ReturnType<typeof nameFormSchema>>;

export const countryFormSchema = z.object({
  name: name(CATALOG_RULES.countryNameMaxLength, "front/catalog:validation.countryNameMax"),
  language_id: z.number().int().positive().nullable(),
});

export type CountryFormValues = z.infer<typeof countryFormSchema>;

export const awardFormSchema = z.object({
  name: name(CATALOG_RULES.awardNameMaxLength, "front/catalog:validation.awardNameMax"),
  year: z
    .number()
    .int("front/catalog:validation.awardYear")
    .min(CATALOG_RULES.awardYearMin, "front/catalog:validation.awardYear")
    .refine((value) => value <= new Date().getFullYear(), "front/catalog:validation.awardYear")
    .nullable(),
  description: z.string().trim().max(CATALOG_RULES.awardDescriptionMaxLength, "front/catalog:validation.descriptionMax"),
});

export type AwardFormValues = z.infer<typeof awardFormSchema>;

const imageTypes: readonly string[] = CATALOG_RULES.imageTypes;

export const authorFormSchema = z.object({
  first_name: name(CATALOG_RULES.authorNameMaxLength, "front/catalog:validation.authorNameMax"),
  last_name: z.string().trim().max(CATALOG_RULES.authorNameMaxLength, "front/catalog:validation.authorNameMax"),
  birthdate: z.string().refine((value) => value === "" || value <= todayIso(), "front/catalog:validation.birthdateFuture"),
  country_id: z.number().int().positive().nullable(),
  about: z.string().trim().max(CATALOG_RULES.authorAboutMaxLength, "front/catalog:validation.aboutMax"),
  image: z
    .instanceof(File)
    .nullable()
    .refine((file) => file === null || imageTypes.includes(file.type), "front/catalog:validation.imageType")
    .refine((file) => file === null || file.size <= CATALOG_RULES.imageMaxMb * MB, "front/catalog:validation.imageSize"),
  remove_image: z.boolean(),
});

export type AuthorFormValues = z.infer<typeof authorFormSchema>;
