import { apiClient } from "../../../shared/api/apiClient";
import type { CatalogKind } from "../catalogTypes";

const upload = { handlesFieldErrors: true, timeout: 30_000 };

export const listCatalogQuery = <T>(kind: CatalogKind): Promise<T[]> => apiClient.list<T>(`/${kind}`);

export const createCatalogMutation = <T>(kind: CatalogKind, data: object | FormData): Promise<T> => apiClient.post<T>(`/${kind}`, data, upload);

export const updateCatalogMutation = <T>(kind: CatalogKind, id: number, data: object | FormData): Promise<T> =>
    apiClient.put<T>(`/${kind}/${id}`, data, upload);

export const deleteCatalogMutation = (kind: CatalogKind, id: number): Promise<void> => apiClient.delete(`/${kind}/${id}`);
