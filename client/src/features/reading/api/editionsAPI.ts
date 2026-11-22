import { apiClient } from "../../../shared/api/apiClient";
import type { Page } from "../../../shared/api/apiTypes";
import type { Edition, EditionAdmin, EditionPayload, EditionUpdatePayload } from "../types/editionTypes";

const fieldErrors = { handlesFieldErrors: true };

export const getEditionsQuery = (bookId: number): Promise<Edition[]> => apiClient.list<Edition>(`/books/${bookId}/editions`);

export const createEditionMutation = ({ bookId, data }: { bookId: number; data: EditionPayload }): Promise<Edition> =>
    apiClient.post<Edition>(`/books/${bookId}/editions`, data, fieldErrors);

export const getEditionsPageQuery = ({ offset, limit }: { offset: number; limit: number }): Promise<Page<EditionAdmin>> =>
    apiClient.page<EditionAdmin>("/editions", { params: { offset, limit } });

export const updateEditionMutation = ({ editionId, data }: { editionId: number; data: EditionUpdatePayload }): Promise<Edition> =>
    apiClient.put<Edition>(`/editions/${editionId}`, data, fieldErrors);

export const deleteEditionMutation = (editionId: number): Promise<void> => apiClient.delete(`/editions/${editionId}`);
