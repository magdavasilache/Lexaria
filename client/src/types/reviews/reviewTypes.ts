export type ReviewAuthor = {
    id: number;
    username: string;
    avatar_url: string | null;
};

export type CommentOut = {
    id: number;
    review_id: number;
    content: string;
    author: ReviewAuthor;
    likes_count: number;
    liked_by_me: boolean;
    can_edit: boolean;
    can_delete: boolean;
    created_at: string;
    updated_at: string;
};

export type ReviewOut = {
    id: number;
    book_id: number;
    rating: number | null;
    content: string | null;
    start_date: string | null;
    end_date: string | null;
    author: ReviewAuthor;
    likes_count: number;
    liked_by_me: boolean;
    can_edit: boolean;
    can_delete: boolean;
    comments: CommentOut[];
    created_at: string;
    updated_at: string;
};

export type ReviewPayload = {
    rating: number | null;
    content: string | null;
    start_date: string | null;
    end_date: string | null;
};

export const REVIEW_SORTS = ["newest", "top"] as const;
export type ReviewSort = (typeof REVIEW_SORTS)[number];

export type ReviewPage = {
    items: ReviewOut[];
    total: number;
};

export type LikeOut = {
    liked: boolean;
    likes_count: number;
};
