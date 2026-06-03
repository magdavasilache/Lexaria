import { UserBookStatus } from "../types/user-book-status-types/UserBookStatusTypes";
import { authorizedAxios } from "./authorizedAxios";

const USER_BOOK_STATUS_URL = 'user_book_status/set_status'

export const setUserBookStatusAPI = {
    setUserBookStatusMutation: async (book_id: number, status: 'want_to_read' | 'currently_reading' | 'read' | 'did_not_finish'): Promise<UserBookStatus> => {
        const { data } = await authorizedAxios(`${USER_BOOK_STATUS_URL}`).post('', {
            book_id,
            status,
        });
        return data
    }
}