import { type ApiResponse, unwrap } from "./apiTypes";
import { authorizedAxios } from "./authorizedAxios";
import type { Edition, EditionAdmin, EditionPayload, EditionUpdatePayload } from "../types/reading-types/editionTypes";

export const getEditionsQuery = async (bookId: number): Promise<Edition[]> =>
    unwrap(await authorizedAxios("books").get<ApiResponse<Edition[]>>(`/${bookId}/editions`)) ?? [];

export const createEditionMutation = async ({ bookId, data }: { bookId: number; data: EditionPayload }): Promise<Edition> =>
    unwrap(await authorizedAxios("books").post<ApiResponse<Edition>>(`/${bookId}/editions`, data, { handlesFieldErrors: true }));

export const getEditionsPageQuery = async ({ offset, limit }: { offset: number; limit: number }): Promise<{ items: EditionAdmin[]; total: number }> => {
    const response = await authorizedAxios("editions").get<ApiResponse<EditionAdmin[]>>("", { params: { offset, limit } });
    return {
        items: response.data.data ?? [],
        total: typeof response.data.meta?.total === "number" ? response.data.meta.total : 0,
    };
};

export const updateEditionMutation = async ({ editionId, data }: { editionId: number; data: EditionUpdatePayload }): Promise<Edition> =>
    unwrap(await authorizedAxios("editions").put<ApiResponse<Edition>>(`/${editionId}`, data, { handlesFieldErrors: true }));

export const deleteEditionMutation = async (editionId: number): Promise<void> => {
    await authorizedAxios("editions").delete(`/${editionId}`);
};
