import type { BookFilters } from "../types/bookTypes";

export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (filters: BookFilters, limit: number) => [...bookKeys.lists(), filters, limit] as const,
  admin: () => [...bookKeys.all, "admin"] as const,
  detail: (bookId: number) => [...bookKeys.all, "detail", bookId] as const,
  recommendations: (limit: number) => [...bookKeys.lists(), "recommendations", limit] as const,
  similar: (bookId: number, limit: number) => [...bookKeys.lists(), "similar", bookId, limit] as const,
};
