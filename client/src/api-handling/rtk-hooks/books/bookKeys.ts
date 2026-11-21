import type { BookFilters } from "../../../types/book-types/bookTypes";

export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (filters: BookFilters, limit: number) => [...bookKeys.lists(), filters, limit] as const,
  admin: () => [...bookKeys.all, "admin"] as const,
  detail: (bookId: number) => [...bookKeys.all, "detail", bookId] as const,
};
