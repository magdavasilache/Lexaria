import { authorizedAxios } from "./authorizedAxios"

const URLS_BASE = 'likes'

const TOGGLE_REVIEW_LIKE = `${URLS_BASE}/review-like`
const TOGGLE_COMMENT_LIKE = `${URLS_BASE}/comment-like`

export const toggleReviewLike = async (review_id: number) => {
    const response = await authorizedAxios(`${TOGGLE_REVIEW_LIKE}`).post('', { review_id })
    return response
}

export const toggleCommentLike = async (comment_id: number) => {
    const response = await authorizedAxios(`${TOGGLE_COMMENT_LIKE}`).post('', { comment_id })
    return response
}