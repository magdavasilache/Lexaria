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

export const splitList = (value: string) =>
  Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));

export const latestPublishedDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + BOOK_RULES.publishedMaxDaysAhead);
  return date.toISOString().slice(0, 10);
};
