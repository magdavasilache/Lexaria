import { BOOK_RULES } from "./bookRules";

export const READING_RULES = {
  noteMaxLength: 5000,
  pagesMax: BOOK_RULES.pagesMax,
  percentMax: 100,
  percentDecimals: 2,
  maxSessionHours: 12,
  goalMinutesMin: 1,
  goalMinutesMax: 1440,
} as const;

export const EDITION_RULES = {
  translatorMaxLength: 255,
  publisherMaxLength: 255,
  isbnInputMaxLength: 17,
  pagesMax: BOOK_RULES.pagesMax,
} as const;
