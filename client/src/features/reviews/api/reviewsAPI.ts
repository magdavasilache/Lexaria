import { apiClient } from "../../../shared/api/apiClient";
import type {
    CommentOut,
    CommentPayload,
    CommentUpdatePayload,
    LikeOut,
    ReviewListQuery,
    ReviewOut,
    ReviewPage,
    ReviewPayload,
    ReviewUpdatePayload,
} from "../reviewTypes";

type ListParams = ReviewListQuery & { bookId: number };

const fieldErrors = { handlesFieldErrors: true };

export const getBookReviewsQuery = ({ bookId, stars, ...params }: ListParams): Promise<ReviewPage> =>
    apiClient.page<ReviewOut>(`/books/${bookId}/reviews`, { params: stars === null ? params : { ...params, stars } });

export const getMyReviewQuery = (bookId: number): Promise<ReviewOut | null> => apiClient.get<ReviewOut | null>(`/books/${bookId}/reviews/mine`);

export const createReviewMutation = ({ bookId, data }: { bookId: number; data: ReviewPayload }): Promise<ReviewOut> =>
    apiClient.post<ReviewOut>(`/books/${bookId}/reviews`, data, fieldErrors);

export const updateReviewMutation = ({ reviewId, data }: { reviewId: number; data: ReviewUpdatePayload }): Promise<ReviewOut> =>
    apiClient.put<ReviewOut>(`/reviews/${reviewId}`, data, fieldErrors);

export const deleteReviewMutation = (reviewId: number): Promise<void> => apiClient.delete(`/reviews/${reviewId}`);

export const createCommentMutation = ({ reviewId, content }: { reviewId: number; content: string }): Promise<CommentOut> => {
    const payload: CommentPayload = { content };
    return apiClient.post<CommentOut>(`/reviews/${reviewId}/comments`, payload, fieldErrors);
};

export const updateCommentMutation = ({ commentId, content }: { commentId: number; content: string }): Promise<CommentOut> => {
    const payload: CommentUpdatePayload = { content };
    return apiClient.put<CommentOut>(`/comments/${commentId}`, payload, fieldErrors);
};

export const deleteCommentMutation = (commentId: number): Promise<void> => apiClient.delete(`/comments/${commentId}`);

export const setLikeMutation = ({ target, id, liked }: { target: "reviews" | "comments"; id: number; liked: boolean }): Promise<LikeOut> =>
    liked ? apiClient.put<LikeOut>(`/${target}/${id}/like`) : apiClient.delete<LikeOut>(`/${target}/${id}/like`);
