export type BookBase = {
    title: string;
    author: string;
    user_id: number;
};

export type CreateBook = BookBase & {
    images?: string[];
    pages?: number;
    language?: string;
    year?: number;
    synopsis?: string;
    tags?: string[];
    awards?: string[];
    characters?: string[];
    settings?: string[];
};

export type BookResponseBase = {
    id: number;
    title: string;
    author_name: string | null;
    user_id: number;
    language_name: string | null;
    synopsis: string | null;
    image: string | null;
    tags: string[] | null;
    pages: number | null;
    average_rating: number;
};

export type ResponseBook = {
    id: number;
    images?: string[];
    pages?: number;
    language_name: string | null;
    year?: number;
    synopsis?: string;
    tags?: string[];
    awards?: string[];
    characters?: string[];
    settings?: string[];
    title: string;
    author_name: string | null;
    user_id: number;
    country_name: string | null;
    published_at: string | null;
    average_rating: number;
    genres: [],
    five_stars: number;
    four_stars: number;
    three_stars: number;
    two_stars: number;
    one_star: number;
    zero_stars: number;
};

export type GetBooksOutput = {
    total_count: number;
    books: BookResponseBase[];
};

export type GetBooksFilters = {
    genres: number[];
    languages: number[];
    authors: number[];
    ratings: number[];
};