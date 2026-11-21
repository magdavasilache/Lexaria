import type { UserBookStatus } from "../user-book-status-types/UserBookStatusTypes";

export type NamedRef = {
  id: number;
  name: string;
};

export type AwardRef = NamedRef & {
  year: number | null;
};

export type RatingBucket = {
  stars: number;
  count: number;
};

export type BookListItem = {
  id: number;
  title: string;
  author_name: string | null;
  language_name: string | null;
  cover_url: string | null;
  pages: number | null;
  synopsis: string | null;
  genres: NamedRef[];
  average_rating: number | null;
  ratings_count: number;
};

export type BookDetail = {
  id: number;
  title: string;
  author_id: number | null;
  author_name: string | null;
  language_id: number | null;
  language_name: string | null;
  country_id: number | null;
  country_name: string | null;
  images: string[];
  image_urls: string[];
  pages: number | null;
  published_at: string | null;
  synopsis: string | null;
  settings: string[];
  characters: string[];
  is_series: boolean;
  genres: NamedRef[];
  awards: AwardRef[];
  average_rating: number | null;
  ratings_count: number;
  rating_histogram: RatingBucket[];
  user_book_status: UserBookStatus | null;
  created_at: string;
  updated_at: string;
};

export const BOOK_SORTS = ["title", "rating", "newest"] as const;
export type BookSort = (typeof BOOK_SORTS)[number];

export type BookFilters = {
  genre_ids: number[];
  author_ids: number[];
  language_ids: number[];
  min_rating: number | null;
  sort: BookSort;
};

export type BookListQuery = BookFilters & {
  q?: string;
  offset: number;
  limit: number;
};

export type BookPage = {
  items: BookListItem[];
  total: number;
};

export type GoodreadsImportSummary = {
  books_created: number;
  genres_added: number;
  statuses_saved: number;
  ratings_added: number;
  rows_skipped: number;
};
