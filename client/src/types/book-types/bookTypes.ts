import type { QueryParams, Schema } from "../../api/apiTypes";

export type BookDescription = Schema<"BookDescriptionOut">;
export type RatingBucket = Schema<"RatingBucket">;
export type ReaderTag = Schema<"ReaderTag">;
export type BookListItem = Schema<"BookListItem">;
export type BookDetail = Schema<"BookDetail">;
export type GoodreadsImportSummary = Schema<"GoodreadsImportSummary">;

type BookSort = Schema<"BookSort">;
export const BOOK_SORTS = ["title", "rating", "newest"] as const satisfies readonly BookSort[];

export type BookListQuery = QueryParams<"list_books_books_get">;

export type BookFilters = Required<Pick<BookListQuery, "genre_ids" | "author_ids" | "language_ids" | "min_rating" | "sort">>;

export type BookPage = {
  items: BookListItem[];
  total: number;
};
