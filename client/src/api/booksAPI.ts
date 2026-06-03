import { GetBooksFilters, GetBooksOutput } from "../types/book-types/bookTypes";
import { authorizedAxios } from "./authorizedAxios";

const BOOK_URL = 'book/get_all_books'
const BOOK_BY_ID_URL = 'book/get_book_by_id'
const BOOK_CREATE_URL = 'book/create'
const BOOK_IMAGES_BATCH_URL = 'book/images'

export const booksAPI = {
    getBooks: async (params: {
        offset: number;
        limit: number;
        filters?: GetBooksFilters;
    }): Promise<GetBooksOutput> => {
        const { offset, limit, filters } = params;

        const queryParams: Record<string, unknown> = { offset, limit };

        if (filters?.genres?.length) queryParams.genres = filters.genres;
        if (filters?.authors?.length) queryParams.authors = filters.authors;
        if (filters?.languages?.length) queryParams.languages = filters.languages;
        if (filters?.ratings?.length) queryParams.ratings = filters.ratings;

        const { data } = await authorizedAxios(BOOK_URL).get('', {
            params: queryParams,
            paramsSerializer: (p) =>
                new URLSearchParams(
                    Object.entries(p).flatMap(([key, val]) =>
                        Array.isArray(val)
                            ? val.map((v) => [key, String(v)])
                            : [[key, String(val)]]
                    )
                ).toString(),
        });

        const filenames = data.books.map((b: any) => b.image).filter(Boolean);
        if (filenames.length) {
            const images = await booksAPI.getBookImagesBatch(filenames);
            data.books = data.books.map((b: any) => ({
                ...b,
                image: images[b.image] ?? null
            }));
        }

        return data;
    },

    getBookImagesBatch: async (filenames: string[]): Promise<Record<string, string>> => {
        const { data } = await authorizedAxios(BOOK_IMAGES_BATCH_URL).post('', filenames);
        return data;
    },

    getBookImages: async (filenames: string[]): Promise<Record<string, string>> => {
        const { data } = await authorizedAxios(BOOK_IMAGES_BATCH_URL).post('', filenames);
        return data;
    },
    getBookById: async (bookId: number) => {
        const { data } = await authorizedAxios(`${BOOK_BY_ID_URL}`).get(`/${bookId}`);
        return data;
    },

    createBookMutation: async (data: FormData) => {
        const response = await authorizedAxios(`${BOOK_CREATE_URL}`).post("", data, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        return response;
    },
}
