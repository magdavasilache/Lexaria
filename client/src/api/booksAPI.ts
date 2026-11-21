import type { ApiResponse, ApiWarning } from "./apiTypes";
import { authorizedAxios } from "./authorizedAxios";
import type { BookDetail, BookListItem, BookListQuery, BookPage, GoodreadsImportSummary } from "../types/book-types/bookTypes";

const BOOKS_URL = "books";
const GOODREADS_IMPORT_URL = "imports/goodreads";
const UPLOAD_TIMEOUT_MS = 60_000;

const toSearchParams = (query: BookListQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
    else params.append(key, String(value));
  });
  return params;
};

export const getBooksQuery = async (query: BookListQuery): Promise<BookPage> => {
  const response = await authorizedAxios(BOOKS_URL).get<ApiResponse<BookListItem[]>>("", { params: toSearchParams(query) });
  return {
    items: response.data.data ?? [],
    total: typeof response.data.meta?.total === "number" ? response.data.meta.total : 0,
  };
};

export const getBookQuery = async (bookId: number): Promise<BookDetail> => {
  const response = await authorizedAxios(BOOKS_URL).get<ApiResponse<BookDetail>>(`/${bookId}`);
  return response.data.data as BookDetail;
};

export const createBookMutation = async (data: FormData): Promise<BookDetail> => {
  const response = await authorizedAxios(BOOKS_URL).post<ApiResponse<BookDetail>>("", data, {
    handlesFieldErrors: true,
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return response.data.data as BookDetail;
};

export const updateBookMutation = async ({ bookId, data }: { bookId: number; data: FormData }): Promise<BookDetail> => {
  const response = await authorizedAxios(BOOKS_URL).put<ApiResponse<BookDetail>>(`/${bookId}`, data, {
    handlesFieldErrors: true,
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return response.data.data as BookDetail;
};

export const deleteBookMutation = async (bookId: number): Promise<void> => {
  await authorizedAxios(BOOKS_URL).delete(`/${bookId}`);
};

export type GoodreadsImportResult = {
  summary: GoodreadsImportSummary;
  warnings: ApiWarning[];
};

export const importGoodreadsMutation = async (data: FormData): Promise<GoodreadsImportResult> => {
  const response = await authorizedAxios(GOODREADS_IMPORT_URL).post<ApiResponse<GoodreadsImportSummary>>("", data, {
    handlesFieldErrors: true,
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return { summary: response.data.data as GoodreadsImportSummary, warnings: response.data.warnings };
};
