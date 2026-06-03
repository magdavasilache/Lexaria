import { ReviewCreate } from "../types/reviews/reviewTypes";
import { authorizedAxios } from "./authorizedAxios";

const URL_BASE = `review`

const CREATE_REVIEWS = `${URL_BASE}/create-review`
const GET_BOOK_REVIEWS = `${URL_BASE}/get-book-reviews/`

export const createReviewMutation = async (data: ReviewCreate) => {
    const response = await authorizedAxios(`${CREATE_REVIEWS}`).post('', data )
    return response
}

export const getBookReviews = async (bookId: number) => {
    const response = await authorizedAxios(`${GET_BOOK_REVIEWS}${bookId}`).get("")
    return response.data.data
}