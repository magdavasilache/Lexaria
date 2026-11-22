import { type ApiResponse, unwrap } from "./apiTypes";
import { authorizedAxios } from "./authorizedAxios";
import type { CatalogKind } from "../types/catalog-types/catalogTypes";

const UPLOAD_TIMEOUT_MS = 30000;

export const listCatalogQuery = async <T>(kind: CatalogKind): Promise<T[]> =>
    unwrap(await authorizedAxios(kind).get<ApiResponse<T[]>>("")) ?? [];

export const createCatalogMutation = async <T>(kind: CatalogKind, data: object | FormData): Promise<T> =>
    unwrap(await authorizedAxios(kind).post<ApiResponse<T>>("", data, { handlesFieldErrors: true, timeout: UPLOAD_TIMEOUT_MS }));

export const updateCatalogMutation = async <T>(kind: CatalogKind, id: number, data: object | FormData): Promise<T> =>
    unwrap(await authorizedAxios(kind).put<ApiResponse<T>>(`/${id}`, data, { handlesFieldErrors: true, timeout: UPLOAD_TIMEOUT_MS }));

export const deleteCatalogMutation = async (kind: CatalogKind, id: number): Promise<void> => {
    await authorizedAxios(kind).delete(`/${id}`);
};
