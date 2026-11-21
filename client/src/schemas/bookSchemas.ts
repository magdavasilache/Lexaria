import { z } from "zod";
import { BOOK_RULES, IMPORT_RULES, MB, latestPublishedDate, splitList } from "./bookRules";

const listField = z
  .string()
  .refine((value) => splitList(value).every((item) => item.length <= BOOK_RULES.listItemMaxLength), "front/books:form.validation.listItemMax")
  .refine((value) => splitList(value).length <= BOOK_RULES.listMaxItems, "front/books:form.validation.listMaxItems");

const imageTypes: readonly string[] = BOOK_RULES.imageTypes;

export const bookFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "front/validation:required")
      .max(BOOK_RULES.titleMaxLength, "front/books:form.validation.titleMax"),
    author_id: z.number().int().positive().nullable(),
    language_id: z.number().int().positive().nullable(),
    country_id: z.number().int().positive().nullable(),
    pages: z
      .number()
      .int("front/books:form.validation.pagesRange")
      .min(1, "front/books:form.validation.pagesRange")
      .max(BOOK_RULES.pagesMax, "front/books:form.validation.pagesRange")
      .nullable(),
    published_at: z
      .string()
      .refine((value) => value === "" || value <= latestPublishedDate(), "front/books:form.validation.publishedTooFar"),
    descriptions: z.record(z.string(), z.string().trim().max(BOOK_RULES.synopsisMaxLength, "front/books:form.validation.synopsisMax")),
    is_series: z.boolean(),
    settings: listField,
    characters: listField,
    genre_ids: z.array(z.number().int().positive()),
    award_ids: z.array(z.number().int().positive()),
    kept_images: z.array(z.string()),
    images: z
      .array(z.instanceof(File))
      .refine((files) => files.every((file) => imageTypes.includes(file.type)), "front/books:form.validation.imageType")
      .refine((files) => files.every((file) => file.size <= BOOK_RULES.imageMaxMb * MB), "front/books:form.validation.imageSize"),
  })
  .refine((values) => values.kept_images.length + values.images.length <= BOOK_RULES.imagesMax, {
    path: ["images"],
    message: "front/books:form.validation.imagesMax",
  });

export type BookFormValues = z.infer<typeof bookFormSchema>;

const fileTypes: readonly string[] = IMPORT_RULES.fileTypes;

const jsonFile = z
  .custom<FileList>((value) => value instanceof FileList)
  .refine((files) => files.length > 0, "front/validation:required")
  .refine(
    (files) => files.length === 0 || (files[0].name.toLowerCase().endsWith(IMPORT_RULES.fileExtension) && fileTypes.includes(files[0].type)),
    "front/imports:validation.jsonType"
  )
  .refine((files) => files.length === 0 || files[0].size <= IMPORT_RULES.fileMaxMb * MB, "front/imports:validation.fileSize");

export const goodreadsImportSchema = z.object({
  favorite_genres: jsonFile,
  reviews: jsonFile,
});

export type GoodreadsImportValues = z.infer<typeof goodreadsImportSchema>;
