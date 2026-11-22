export const REVIEW_RULES = {
  contentMaxLength: 20000,
  commentMaxLength: 2000,
  ratingMin: 0.5,
  ratingMax: 5,
  ratingStep: 0.5,
  pageSize: 10,
} as const;

export const today = () => new Date().toISOString().slice(0, 10);
