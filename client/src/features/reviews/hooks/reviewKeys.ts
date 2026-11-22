import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { CommentOut, ReviewOut, ReviewPage, ReviewSort } from "../reviewTypes";

export const reviewKeys = {
  all: ["reviews"] as const,
  book: (bookId: number) => [...reviewKeys.all, "book", bookId] as const,
  list: (bookId: number, sort: ReviewSort, stars: number | null) => [...reviewKeys.book(bookId), "list", sort, stars] as const,
  mine: (bookId: number) => [...reviewKeys.book(bookId), "mine"] as const,
};

type ReviewCache = InfiniteData<ReviewPage> | ReviewOut | null | undefined;

const mapCache = (data: ReviewCache, update: (review: ReviewOut) => ReviewOut): ReviewCache => {
  if (!data) return data;
  if ("pages" in data) {
    return { ...data, pages: data.pages.map((page) => ({ ...page, items: page.items.map(update) })) };
  }
  return update(data);
};

export const updateReviews = (queryClient: QueryClient, bookId: number, update: (review: ReviewOut) => ReviewOut) =>
  queryClient.setQueriesData<ReviewCache>({ queryKey: reviewKeys.book(bookId) }, (data) => mapCache(data, update));

export const updateComment = (
  queryClient: QueryClient,
  bookId: number,
  commentId: number,
  update: (comment: CommentOut) => CommentOut
) =>
  updateReviews(queryClient, bookId, (review) =>
    review.comments.some((comment) => comment.id === commentId)
      ? { ...review, comments: review.comments.map((comment) => (comment.id === commentId ? update(comment) : comment)) }
      : review
  );
