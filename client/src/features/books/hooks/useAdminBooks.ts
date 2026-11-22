import { useQuery } from "@tanstack/react-query";
import { getBooksQuery } from "../api/booksAPI";
import type { BookListItem } from "../types/bookTypes";
import { bookKeys } from "./bookKeys";

const ADMIN_PAGE_SIZE = 100;

const getAllBooks = async (): Promise<BookListItem[]> => {
  const books: BookListItem[] = [];
  let total = Infinity;
  while (books.length < total) {
    const page = await getBooksQuery({ genre_ids: [], author_ids: [], language_ids: [], min_rating: null, sort: "newest", offset: books.length, limit: ADMIN_PAGE_SIZE });
    books.push(...page.items);
    total = page.total;
    if (page.items.length === 0) break;
  }
  return books;
};

export const useAdminBooks = (enabled = true) =>
  useQuery({
    queryKey: bookKeys.admin(),
    queryFn: getAllBooks,
    enabled,
  });
