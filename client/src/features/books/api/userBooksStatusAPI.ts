import { apiClient } from "../../../shared/api/apiClient";
import type { ReadingStatus, UserBookStatus, UserBookStatusPayload } from "../types/UserBookStatusTypes";

export const setReadingStatusMutation = ({ bookId, status }: { bookId: number; status: ReadingStatus }): Promise<UserBookStatus> => {
    const payload: UserBookStatusPayload = { status };
    return apiClient.put<UserBookStatus>(`/books/${bookId}/status`, payload);
};

export const removeReadingStatusMutation = (bookId: number): Promise<void> => apiClient.delete(`/books/${bookId}/status`);
