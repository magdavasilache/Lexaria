export const BOOK_RULES = {
  titleMaxLength: 255,
  synopsisMaxLength: 5000,
  pagesMax: 20000,
  listItemMaxLength: 100,
  listMaxItems: 30,
  imagesMax: 3,
  imageMaxMb: 5,
  imageTypes: ["image/jpeg", "image/png", "image/webp"],
  publishedMaxDaysAhead: 365,
  pageSize: 24,
  ratingMax: 5,
} as const;

export const DESCRIPTION_LANGUAGES = [
  "en", "ro", "fr", "de", "es", "it", "pt", "pt-BR", "nl", "pl", "hu", "cs", "sk", "bg",
  "el", "ru", "uk", "sv", "da", "no", "fi", "tr", "ar", "he", "ja", "zh", "ko",
] as const;

export const IMPORT_RULES = {
  fileMaxMb: 10,
  fileTypes: ["application/json", ""],
  fileExtension: ".json",
} as const;

export const MB = 1024 * 1024;

export const splitList = (value: string) =>
  Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));

export const latestPublishedDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + BOOK_RULES.publishedMaxDaysAhead);
  return date.toISOString().slice(0, 10);
};
