import { UserOut } from "../auth-types/userTypes"

export type CommentOut = {
    id: number
    user_liked: boolean
    user: UserOut
    comment_content: string
    created_at: string
    can_edit: boolean
    likes_count: number
}

export type CommentCreate = {
    review_id: number
    comment_content: string
}