import { CommentCreate } from "../types/comments/commentsTypes"
import { authorizedAxios } from "./authorizedAxios"

const URL_BASE = 'comment'

const CREATE_COMMENT = `${URL_BASE}/create-comment`

export const createCommentMutation = async (data: CommentCreate) => {
    const response = await authorizedAxios(`${CREATE_COMMENT}`).post('', data)
    return response
}