import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCommentMutation,
  createReviewMutation,
  deleteCommentMutation,
  deleteReviewMutation,
  setLikeMutation,
  updateCommentMutation,
  updateReviewMutation,
} from "../../../api/reviewsAPI";
import { useSnackbarStore } from "../../context/snackbar/useSnackbarStore";
import { bookKeys } from "../books/bookKeys";
import { reviewKeys, updateComment, updateReviews } from "./reviewKeys";

const useRefreshBook = () => {
  const queryClient = useQueryClient();
  return (bookId: number) => {
    queryClient.invalidateQueries({ queryKey: reviewKeys.book(bookId) });
    queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    queryClient.invalidateQueries({ queryKey: bookKeys.admin() });
  };
};

export const useSaveReview = (bookId: number) => {
  const refreshBook = useRefreshBook();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: ({ reviewId, data }: { reviewId: number | null; data: Parameters<typeof createReviewMutation>[0]["data"] }) =>
      reviewId === null ? createReviewMutation({ bookId, data }) : updateReviewMutation({ reviewId, data }),
    onSuccess: (_, { reviewId }) => {
      refreshBook(bookId);
      showSnackBar({ key: reviewId === null ? "front/reviews:snackbar.created" : "front/reviews:snackbar.updated" }, "success");
    },
  });
};

export const useDeleteReview = (bookId: number) => {
  const refreshBook = useRefreshBook();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: deleteReviewMutation,
    onSuccess: () => {
      refreshBook(bookId);
      showSnackBar({ key: "front/reviews:snackbar.deleted" }, "success");
    },
  });
};

export const useSaveComment = (bookId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, commentId, content }: { reviewId: number; commentId: number | null; content: string }) =>
      commentId === null ? createCommentMutation({ reviewId, content }) : updateCommentMutation({ commentId, content }),
    onSuccess: (comment, { commentId }) => {
      if (commentId === null) {
        updateReviews(queryClient, bookId, (review) =>
          review.id === comment.review_id ? { ...review, comments: [...review.comments, comment] } : review
        );
      } else {
        updateComment(queryClient, bookId, comment.id, () => comment);
      }
    },
  });
};

export const useDeleteComment = (bookId: number) => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: ({ commentId }: { commentId: number }) => deleteCommentMutation(commentId),
    onSuccess: (_, { commentId }) => {
      updateReviews(queryClient, bookId, (review) => ({
        ...review,
        comments: review.comments.filter((comment) => comment.id !== commentId),
      }));
      showSnackBar({ key: "front/reviews:snackbar.commentDeleted" }, "success");
    },
  });
};

type LikeTarget = { target: "reviews" | "comments"; id: number; liked: boolean };

export const useSetLike = (bookId: number) => {
  const queryClient = useQueryClient();

  const apply = ({ target, id }: LikeTarget, liked: boolean, count: (current: number) => number) => {
    if (target === "reviews") {
      updateReviews(queryClient, bookId, (review) =>
        review.id === id ? { ...review, liked_by_me: liked, likes_count: count(review.likes_count) } : review
      );
    } else {
      updateComment(queryClient, bookId, id, (comment) => ({ ...comment, liked_by_me: liked, likes_count: count(comment.likes_count) }));
    }
  };

  return useMutation({
    mutationFn: setLikeMutation,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: reviewKeys.book(bookId) });
      apply(variables, variables.liked, (current) => Math.max(0, current + (variables.liked ? 1 : -1)));
    },
    onError: (_, variables) => {
      apply(variables, !variables.liked, (current) => Math.max(0, current + (variables.liked ? -1 : 1)));
    },
    onSuccess: (result, variables) => {
      apply(variables, result.liked, () => result.likes_count);
    },
  });
};
