import type { ApiResponse } from "./apiTypes";
import { authorizedAxios } from "./authorizedAxios";
import type { ReadingStatus, UserBookStatus } from "../types/user-book-status-types/UserBookStatusTypes";

export const setReadingStatusMutation = async ({ bookId, status }: { bookId: number; status: ReadingStatus }): Promise<UserBookStatus> => {
    const response = await authorizedAxios("books").put<ApiResponse<UserBookStatus>>(`/${bookId}/status`, { status });
    return response.data.data as UserBookStatus;
};

export const removeReadingStatusMutation = async (bookId: number): Promise<void> => {
    await authorizedAxios("books").delete(`/${bookId}/status`);
};
