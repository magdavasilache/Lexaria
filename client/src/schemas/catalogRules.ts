import { BOOK_RULES } from "./bookRules";

export const CATALOG_RULES = {
  languageNameMaxLength: 50,
  genreNameMaxLength: 50,
  countryNameMaxLength: 100,
  awardNameMaxLength: 150,
  awardDescriptionMaxLength: 2000,
  awardYearMin: 1800,
  authorNameMaxLength: 100,
  authorAboutMaxLength: 5000,
  imageMaxMb: BOOK_RULES.imageMaxMb,
  imageTypes: BOOK_RULES.imageTypes,
} as const;

export const NAME_MAX_LENGTH = {
  languages: CATALOG_RULES.languageNameMaxLength,
  genres: CATALOG_RULES.genreNameMaxLength,
} as const;

export const todayIso = () => new Date().toISOString().slice(0, 10);
