import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { BookFilters } from "../types/bookTypes";

const DEFAULT_FILTERS: BookFilters = {
  q: "",
  genre_ids: [],
  author_ids: [],
  language_ids: [],
  min_rating: null,
  moods: [],
  paces: [],
  avoid_warnings: [],
  min_pages: null,
  max_pages: null,
  sort: "relevance",
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
        version: 5,
        migrate: () => ({ filters: DEFAULT_FILTERS }),
        partialize: (state) => ({ filters: state.filters }),
      }
    )
  )
);

export const countActiveFilters = (filters: BookFilters) =>
  (filters.q.trim() ? 1 : 0) +
  filters.genre_ids.length +
  filters.author_ids.length +
  filters.language_ids.length +
  (filters.min_rating === null ? 0 : 1) +
  filters.moods.length +
  filters.paces.length +
  filters.avoid_warnings.length +
  (filters.min_pages === null ? 0 : 1) +
  (filters.max_pages === null ? 0 : 1);

export const resetBooksStore = () => useBooksStore.setState({ filters: DEFAULT_FILTERS });
