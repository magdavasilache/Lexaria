import type { QueryParams, Schema, Page } from "../../../shared/api/apiTypes";

export type BookDescription = Schema<"BookDescriptionOut">;
export type RatingBucket = Schema<"RatingBucket">;
export type ReaderTag = Schema<"ReaderTag">;
export type BookListItem = Schema<"BookListItem">;
export type BookDetail = Schema<"BookDetail">;

export type Mood = Schema<"Mood">;
export const MOODS = [
  "adventurous",
  "challenging",
  "dark",
  "emotional",
  "funny",
  "hopeful",
  "informative",
  "inspiring",
  "lighthearted",
  "mysterious",
  "reflective",
  "relaxing",
  "sad",
  "tense",
] as const satisfies readonly Mood[];

export type Pace = Schema<"Pace">;
export const PACES = ["slow", "medium", "fast"] as const satisfies readonly Pace[];

export type ContentWarning = Schema<"ContentWarning">;
export const CONTENT_WARNINGS = [
  "addiction",
  "animal_cruelty",
  "body_horror",
  "bullying",
  "cancer",
  "child_abuse",
  "death",
  "death_of_parent",
  "domestic_abuse",
  "eating_disorder",
  "gore",
  "gun_violence",
  "homophobia",
  "infidelity",
  "kidnapping",
  "mental_illness",
  "misogyny",
  "pregnancy_loss",
  "racism",
  "self_harm",
  "sexual_assault",
  "sexual_content",
  "suicide",
  "terminal_illness",
  "torture",
  "transphobia",
  "violence",
  "war",
] as const satisfies readonly ContentWarning[];

export type WarningSeverity = Schema<"WarningSeverity">;
export const WARNING_SEVERITIES = ["minor", "moderate", "graphic"] as const satisfies readonly WarningSeverity[];

export type ContentWarnings = Schema<"ContentWarningsOut">;
export type ContentWarningsPayload = Schema<"ContentWarningsUpdate">;

export type ReaderSignals = Schema<"ReaderSignalsOut">;
export type Recommendation = Schema<"RecommendationOut">;
export type ReaderVotePayload = Schema<"ReaderVoteUpdate">;

type BookSort = Schema<"BookSort">;
export const BOOK_SORTS = ["relevance", "title", "rating", "newest"] as const satisfies readonly BookSort[];

export type BookListQuery = QueryParams<"list_books_books_get">;

export type BookFilters = Required<
  Pick<BookListQuery, "genre_ids" | "author_ids" | "language_ids" | "min_rating" | "moods" | "paces" | "avoid_warnings" | "min_pages" | "max_pages" | "sort">
> & { q: string };

export type BookPage = Page<BookListItem>;
