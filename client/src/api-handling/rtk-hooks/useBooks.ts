import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useBooksStore } from "../../state_management/useBooksStore";
import { booksAPI } from "../../api/booksAPI";
import { GetBooksOutput } from "../../types/book-types/bookTypes";
import { useEffect, useRef } from "react";

export const useBooks = () => {
    const filters = useBooksStore((state) => state.filters);
    const limit = useBooksStore((state) => state.limit);
    const booksAreFetched = useBooksStore((state) => state.booksAreFetched);
    const setBooksAreFetched = useBooksStore((state) => state.setBooksAreFetched);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const queryKey = ['books', filters, limit] as const;

    const query = useInfiniteQuery<
        GetBooksOutput,
        Error,
        InfiniteData<GetBooksOutput>,
        typeof queryKey,
        number
    >({
        queryKey,
        queryFn: ({ pageParam = 0 }) => booksAPI.getBooks({
            offset: pageParam,
            limit,
            filters,
        }),
        getNextPageParam: (lastPage, allPages) => {
            const totalFetched = allPages.length * limit;
            return totalFetched < lastPage.total_count ? totalFetched : undefined;
        },
        getPreviousPageParam: (_firstPage, allPages) => {
            return allPages.length > 1 ? Math.max(0, (allPages.length - 2) * limit) : undefined;
        },
        initialPageParam: 0,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    useEffect(() => {
        if (query.data && !booksAreFetched) {
            setBooksAreFetched(true);
        }
    }, [query.data, booksAreFetched, setBooksAreFetched]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
                    query.fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

    const books = query.data?.pages.flatMap(page => page.books) || []
    const totalCount = query.data?.pages[0]?.total_count || 0;

    return {
        ...query,
        books,
        sentinelRef,
        totalCount,
        hasNextPage: query.hasNextPage,
        hasPreviousPage: query.hasPreviousPage,
        fetchNextPage: query.fetchNextPage,
        fetchPreviousPage: query.fetchPreviousPage,
        isFetchingNextPage: query.isFetchingNextPage,
        isFetchingPreviousPage: query.isFetchingPreviousPage,
    };
};