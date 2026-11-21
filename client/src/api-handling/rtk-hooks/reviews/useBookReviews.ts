import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getBookReviewsQuery, getMyReviewQuery } from "../../../api/reviewsAPI";
import { REVIEW_RULES } from "../../../schemas/reviewRules";
import type { ReviewSort } from "../../../types/reviews/reviewTypes";
import { reviewKeys } from "./reviewKeys";

export const useBookReviews = (bookId: number, sort: ReviewSort, stars: number | null) => {
  const query = useInfiniteQuery({
    queryKey: reviewKeys.list(bookId, sort, stars),
    queryFn: ({ pageParam }) => getBookReviewsQuery({ bookId, sort, stars, offset: pageParam, limit: REVIEW_RULES.pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((count, page) => count + page.items.length, 0);
      return lastPage.items.length > 0 && loaded < lastPage.total ? loaded : undefined;
    },
  });

  return {
    ...query,
    reviews: query.data?.pages.flatMap((page) => page.items) ?? [],
    total: query.data?.pages[0]?.total ?? 0,
  };
};

export const useMyReview = (bookId: number) =>
  useQuery({
    queryKey: reviewKeys.mine(bookId),
    queryFn: () => getMyReviewQuery(bookId),
  });
