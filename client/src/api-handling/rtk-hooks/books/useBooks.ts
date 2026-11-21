import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getBooksQuery } from "../../../api/booksAPI";
import { BOOK_RULES } from "../../../schemas/bookRules";
import { useBooksStore } from "../../../state_management/useBooksStore";
import { bookKeys } from "./bookKeys";

export const useBooks = () => {
  const filters = useBooksStore((state) => state.filters);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const limit = BOOK_RULES.pageSize;

  const query = useInfiniteQuery({
    queryKey: bookKeys.list(filters, limit),
    queryFn: ({ pageParam }) => getBooksQuery({ ...filters, offset: pageParam, limit }),
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
