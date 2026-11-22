import type { ApiResponse } from "./apiTypes";
import { authorizedAxios } from "./authorizedAxios";
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
} from "../types/reviews/reviewTypes";

type ListParams = ReviewListQuery & { bookId: number };

export const getBookReviewsQuery = async ({ bookId, stars, ...params }: ListParams): Promise<ReviewPage> => {
    const response = await authorizedAxios("books").get<ApiResponse<ReviewOut[]>>(`/${bookId}/reviews`, {
        params: stars === null ? params : { ...params, stars },
    });
    return {
        items: response.data.data ?? [],
        total: typeof response.data.meta?.total === "number" ? response.data.meta.total : 0,
    };
};

export const getMyReviewQuery = async (bookId: number): Promise<ReviewOut | null> => {
    const response = await authorizedAxios("books").get<ApiResponse<ReviewOut | null>>(`/${bookId}/reviews/mine`);
    return response.data.data;
};

export const createReviewMutation = async ({ bookId, data }: { bookId: number; data: ReviewPayload }): Promise<ReviewOut> => {
    const response = await authorizedAxios("books").post<ApiResponse<ReviewOut>>(`/${bookId}/reviews`, data, { handlesFieldErrors: true });
    return response.data.data as ReviewOut;
};

export const updateReviewMutation = async ({ reviewId, data }: { reviewId: number; data: ReviewUpdatePayload }): Promise<ReviewOut> => {
    const response = await authorizedAxios("reviews").put<ApiResponse<ReviewOut>>(`/${reviewId}`, data, { handlesFieldErrors: true });
    return response.data.data as ReviewOut;
};

export const deleteReviewMutation = async (reviewId: number): Promise<void> => {
    await authorizedAxios("reviews").delete(`/${reviewId}`);
};

export const createCommentMutation = async ({ reviewId, content }: { reviewId: number; content: string }): Promise<CommentOut> => {
    const payload: CommentPayload = { content };
    const response = await authorizedAxios("reviews").post<ApiResponse<CommentOut>>(`/${reviewId}/comments`, payload, { handlesFieldErrors: true });
    return response.data.data as CommentOut;
};

export const updateCommentMutation = async ({ commentId, content }: { commentId: number; content: string }): Promise<CommentOut> => {
    const payload: CommentUpdatePayload = { content };
    const response = await authorizedAxios("comments").put<ApiResponse<CommentOut>>(`/${commentId}`, payload, { handlesFieldErrors: true });
    return response.data.data as CommentOut;
};

export const deleteCommentMutation = async (commentId: number): Promise<void> => {
    await authorizedAxios("comments").delete(`/${commentId}`);
};

export const setLikeMutation = async ({ target, id, liked }: { target: "reviews" | "comments"; id: number; liked: boolean }): Promise<LikeOut> => {
    const client = authorizedAxios(target);
    const response = liked
        ? await client.put<ApiResponse<LikeOut>>(`/${id}/like`)
        : await client.delete<ApiResponse<LikeOut>>(`/${id}/like`);
    return response.data.data as LikeOut;
};
