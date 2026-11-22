import type { QueryParams, Schema } from "../../api/apiTypes";

export type ReviewAuthor = Schema<"ReviewerOut">;
export type CommentOut = Schema<"CommentOut">;
export type ReviewOut = Schema<"ReviewOut">;
export type LikeOut = Schema<"LikeOut">;

export type ReviewPayload = Schema<"ReviewCreate">;
export type ReviewUpdatePayload = Schema<"ReviewUpdate">;
export type CommentPayload = Schema<"CommentCreate">;
export type CommentUpdatePayload = Schema<"CommentUpdate">;

export type ReviewSort = Schema<"ReviewSort">;
export const REVIEW_SORTS = ["newest", "top"] as const satisfies readonly ReviewSort[];

export type ReviewListQuery = Required<QueryParams<"list_reviews_books__book_id__reviews_get">>;

export type ReviewPage = {
    items: ReviewOut[];
    total: number;
};
