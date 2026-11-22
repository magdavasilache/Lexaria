import { z } from "zod";
import { encodeMessage } from "../../../i18n/message";
import { EDITION_FORMATS, PERCENT_FORMATS, type Edition } from "../types/editionTypes";
import { latestPublishedDate } from "../../books/schemas/bookRules";
import { EDITION_RULES, READING_RULES } from "./readingRules";

export type ProgressBounds = { usesPercent: boolean; min: number; max: number };

export const NO_EDITION = "none";

export const editionBounds = (edition: Edition | null | undefined): ProgressBounds => {
  const usesPercent = Boolean(edition && !edition.tracks_pages);
  return { usesPercent, min: 0, max: usesPercent ? READING_RULES.percentMax : edition?.pages ?? READING_RULES.pagesMax };
};

const findEdition = (editions: Edition[], value: string) => editions.find((edition) => String(edition.id) === value) ?? null;

const rangeMessage = ({ usesPercent, min, max }: ProgressBounds, value: number) =>
  value < min || value > max || (!usesPercent && !Number.isInteger(value))
    ? encodeMessage({ key: usesPercent ? "front/reading:validation.percentRange" : "front/reading:validation.pageRange", params: { min, max } })
    : null;

const progressField = (bounds: ProgressBounds, required: boolean) =>
  z
    .number()
    .nullable()
    .superRefine((value, context) => {
      if (value === null) {
        if (required) context.addIssue({ code: z.ZodIssueCode.custom, message: "front/validation:required" });
        return;
      }
      const message = rangeMessage(bounds, value);
      if (message) context.addIssue({ code: z.ZodIssueCode.custom, message });
    });

const checkProgress = (bounds: ProgressBounds, value: number | null, context: z.RefinementCtx) => {
  const message = value === null ? null : rangeMessage(bounds, value);
  if (message) context.addIssue({ code: z.ZodIssueCode.custom, path: ["progress"], message });
};

const noteField = z.string().trim().max(READING_RULES.noteMaxLength, "front/reading:validation.noteMax");

const notInFuture = (value: string) => value === "" || new Date(value).getTime() <= Date.now();

export const endSessionSchema = (bounds: ProgressBounds, startedAt: string, needsEndTime: boolean) =>
  z.object({
    progress: progressField(bounds, true),
    note: noteField,
    mark_finished: z.boolean(),
    ended_at: z
      .string()
      .refine((value) => !needsEndTime || value !== "", "front/validation:required")
      .refine(
        (value) => value === "" || (new Date(value).getTime() >= new Date(startedAt).getTime() && notInFuture(value)),
        "front/reading:validation.endTimeRange"
      ),
  });

export type EndSessionValues = z.infer<ReturnType<typeof endSessionSchema>>;

export const sessionNoteSchema = (bounds: ProgressBounds) =>
  z.object({
    content: noteField.min(1, "front/validation:required"),
    progress: progressField(bounds, false),
  });

export type SessionNoteValues = z.infer<ReturnType<typeof sessionNoteSchema>>;

export const noteContentSchema = z.object({ content: noteField.min(1, "front/validation:required") });

export type NoteContentValues = z.infer<typeof noteContentSchema>;

export const startSessionSchema = (editions: Edition[]) =>
  z
    .object({
      edition: z.string().min(1, "front/reading:validation.editionRequired"),
      progress: z.number().nullable(),
    })
    .superRefine((values, context) => checkProgress(editionBounds(findEdition(editions, values.edition)), values.progress, context));

export type StartSessionValues = z.infer<ReturnType<typeof startSessionSchema>>;

export const readingEditSchema = (editions: Edition[], isActive: boolean) =>
  z
    .object({
      edition: z.string(),
      started_at: z.string().min(1, "front/validation:required").refine(notInFuture, "front/reading:validation.futureTime"),
      finished_at: z.string().refine(notInFuture, "front/reading:validation.futureTime"),
      progress: z.number().nullable(),
    })
    .superRefine((values, context) => {
      if (!isActive && values.finished_at === "") {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["finished_at"], message: "front/validation:required" });
      }
      if (values.finished_at && values.started_at && values.finished_at < values.started_at) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["finished_at"], message: "front/reading:validation.finishBeforeStart" });
      }
      checkProgress(editionBounds(findEdition(editions, values.edition)), values.progress, context);
    });

export type ReadingEditValues = z.infer<ReturnType<typeof readingEditSchema>>;

export const isbnValid = (raw: string) => {
  const compact = raw.replace(/[-\s]/g, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(compact)) {
    const sum = [...compact].reduce((total, char, index) => total + (10 - index) * (char === "X" ? 10 : Number(char)), 0);
    return sum % 11 === 0;
  }
  if (/^\d{13}$/.test(compact)) {
    const sum = [...compact.slice(0, 12)].reduce((total, char, index) => total + Number(char) * (index % 2 === 0 ? 1 : 3), 0);
    return (10 - (sum % 10)) % 10 === Number(compact[12]);
  }
  return false;
};

export const editionFormSchema = z
  .object({
    format: z.enum(EDITION_FORMATS).nullable(),
    pages: z
      .number()
      .int("front/reading:validation.editionPages")
      .min(1, "front/reading:validation.editionPages")
      .max(EDITION_RULES.pagesMax, "front/reading:validation.editionPages")
      .nullable(),
    language_id: z.number().int().positive().nullable(),
    translator: z.string().trim().max(EDITION_RULES.translatorMaxLength, "front/reading:validation.translatorMax"),
    publisher: z.string().trim().max(EDITION_RULES.publisherMaxLength, "front/reading:validation.publisherMax"),
    published_at: z.string().refine((value) => value === "" || value <= latestPublishedDate(), "front/reading:validation.publishedTooFar"),
    isbn: z
      .string()
      .trim()
      .max(EDITION_RULES.isbnInputMaxLength, "front/reading:validation.isbnInvalid")
      .refine((value) => value === "" || isbnValid(value), "front/reading:validation.isbnInvalid"),
  })
  .superRefine((values, context) => {
    if (values.format === null) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["format"], message: "front/validation:required" });
    } else if (!PERCENT_FORMATS.includes(values.format) && values.pages === null) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["pages"], message: "front/reading:validation.pagesRequired" });
    }
  });

export type EditionFormValues = z.infer<typeof editionFormSchema>;

export const readingGoalSchema = z.object({
  minutes: z
    .number()
    .int("front/reading:validation.goalRange")
    .min(READING_RULES.goalMinutesMin, "front/reading:validation.goalRange")
    .max(READING_RULES.goalMinutesMax, "front/reading:validation.goalRange")
    .nullable(),
});

export type ReadingGoalValues = z.infer<typeof readingGoalSchema>;
