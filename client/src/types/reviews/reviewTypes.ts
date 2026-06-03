import { UserOut } from "../auth-types/userTypes";
import { CommentOut } from "../comments/commentsTypes";
import { UserBookStatus } from "../user-book-status-types/UserBookStatusTypes";

interface ReviewBase {
    book_id: number;
    rating: number | null;
    review_content: string | null;
}

export type ReviewCreate = ReviewBase

export type ReviewOut = {
    id: number
    rating: number | null
    review_content: string | null
    created_at: string
    comments: CommentOut[] | null
    user_liked: boolean
    user_book_status: UserBookStatus | null
    user: UserOut
    can_edit: boolean
    likes_count: number
}