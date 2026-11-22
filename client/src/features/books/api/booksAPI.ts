import { apiClient } from "../../../shared/api/apiClient";
import type {
  BookDetail,
  BookListItem,
  BookListQuery,
  BookPage,
  ContentWarnings,
  ContentWarningsPayload,
  ReaderSignals,
  ReaderVotePayload,
  Recommendation,
} from "../types/bookTypes";

const UPLOAD_TIMEOUT_MS = 60_000;
const upload = { handlesFieldErrors: true, timeout: UPLOAD_TIMEOUT_MS };

const toSearchParams = (query: BookListQuery) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
    else params.append(key, String(value));
  });
  return params;
};

export const getBooksQuery = (query: BookListQuery): Promise<BookPage> =>
  apiClient.page<BookListItem>("/books", { params: toSearchParams(query) });

export const getBookQuery = (bookId: number): Promise<BookDetail> => apiClient.get<BookDetail>(`/books/${bookId}`);

export const createBookMutation = (data: FormData): Promise<BookDetail> => apiClient.post<BookDetail>("/books", data, upload);

export const updateBookMutation = ({ bookId, data }: { bookId: number; data: FormData }): Promise<BookDetail> =>
  apiClient.put<BookDetail>(`/books/${bookId}`, data, upload);

export const deleteBookMutation = (bookId: number): Promise<void> => apiClient.delete(`/books/${bookId}`);

export const setReaderVoteMutation = ({ bookId, payload }: { bookId: number; payload: ReaderVotePayload }): Promise<ReaderSignals> =>
  apiClient.put<ReaderSignals>(`/books/${bookId}/signals/mine`, payload, { handlesFieldErrors: true });

export const removeReaderVoteMutation = (bookId: number): Promise<ReaderSignals> =>
  apiClient.delete<ReaderSignals>(`/books/${bookId}/signals/mine`);

export const getRecommendationsQuery = (limit: number): Promise<Recommendation[]> =>
  apiClient.list<Recommendation>("/recommendations", { params: { limit } });

export const getSimilarBooksQuery = (bookId: number, limit: number): Promise<BookListItem[]> =>
  apiClient.list<BookListItem>(`/books/${bookId}/similar`, { params: { limit } });

export const setContentWarningsMutation = ({ bookId, payload }: { bookId: number; payload: ContentWarningsPayload }): Promise<ContentWarnings> =>
  apiClient.put<ContentWarnings>(`/books/${bookId}/content-warnings/mine`, payload, { handlesFieldErrors: true });

export const removeContentWarningsMutation = (bookId: number): Promise<ContentWarnings> =>
  apiClient.delete<ContentWarnings>(`/books/${bookId}/content-warnings/mine`);
