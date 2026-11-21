import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { BookFilters } from "../types/book-types/bookTypes";

const DEFAULT_FILTERS: BookFilters = {
  genre_ids: [],
  author_ids: [],
  language_ids: [],
  min_rating: null,
  sort: "title",
};

type BooksState = {
  filters: BookFilters;
  setFilters: (filters: Partial<BookFilters>) => void;
  clearFilters: () => void;
};

export const useBooksStore = create<BooksState>()(
  devtools(
    persist(
      (set) => ({
        filters: DEFAULT_FILTERS,
        setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
        clearFilters: () => set((state) => ({ filters: { ...DEFAULT_FILTERS, sort: state.filters.sort } })),
      }),
      {
        name: "books-store",
        version: 2,
        migrate: () => ({ filters: DEFAULT_FILTERS }),
        partialize: (state) => ({ filters: state.filters }),
      }
    )
  )
);

export const resetBooksStore = () => useBooksStore.setState({ filters: DEFAULT_FILTERS });
