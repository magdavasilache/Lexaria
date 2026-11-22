import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getBooksQuery } from "../api/booksAPI";
import { BOOK_RULES } from "../schemas/bookRules";
import { useBooksStore } from "../stores/useBooksStore";
import { useDebouncedValue } from "../../../shared/utils/useDebouncedValue";
import { bookKeys } from "./bookKeys";
import type { BookFilters } from "../types/bookTypes";

const SEARCH_DEBOUNCE_MS = 300;

export const pagesRangeInvalid = ({ min_pages, max_pages }: Pick<BookFilters, "min_pages" | "max_pages">) =>
  min_pages !== null && max_pages !== null && max_pages < min_pages;

export const useBooks = () => {
  const storedFilters = useBooksStore((state) => state.filters);
  const q = useDebouncedValue(storedFilters.q.trim(), SEARCH_DEBOUNCE_MS);
  const minPages = useDebouncedValue(storedFilters.min_pages, SEARCH_DEBOUNCE_MS);
  const maxPages = useDebouncedValue(storedFilters.max_pages, SEARCH_DEBOUNCE_MS);
  const rangeInvalid = pagesRangeInvalid({ min_pages: minPages, max_pages: maxPages });
  const filters = { ...storedFilters, q, min_pages: minPages, max_pages: rangeInvalid ? null : maxPages };
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const limit = BOOK_RULES.pageSize;

  const query = useInfiniteQuery({
    queryKey: bookKeys.list(filters, limit),
    queryFn: ({ pageParam }) => getBooksQuery({ ...filters, q: q || null, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((count, page) => count + page.items.length, 0);
      return lastPage.items.length > 0 && loaded < lastPage.total ? loaded : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    ...query,
    books: query.data?.pages.flatMap((page) => page.items) ?? [],
    totalCount: query.data?.pages[0]?.total ?? 0,
    sentinelRef,
  };
};
