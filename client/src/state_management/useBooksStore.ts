import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { GetBooksFilters } from "../types/book-types/bookTypes";

export interface PaginationParams {
    offset: number;
    limit: number;
}

interface BooksState {
    filters: GetBooksFilters;
    selectedBooks: Set<string>;
    currentBookIndex: number;
    limit: number;
    booksAreFetched: boolean;
}

interface BooksActions {
    setFilters: (filters: Partial<GetBooksFilters>) => void;
    clearFilters: () => void;
    toggleBookSelection: (bookId: string) => void;
    clearSelection: () => void;
    setCurrentBookIndex: (index: number) => void;
    navigateToNextBook: () => void;
    navigateToPreviousBook: () => void;
    resetNavigation: () => void;
    setBooksAreFetched: (input: boolean) => void
    resetBookStore: () => void
}

export const useBooksStore = create<BooksState & BooksActions>()(
    devtools(
        persist(
            (set, get) => ({
                filters: {genres: [], languages: [], authors: [], ratings: []},
                selectedBooks: new Set(),
                currentBookIndex: 0,
                limit: 50,
                booksAreFetched: false,
                booksCache: [],
                totalCount: 0,
                setFilters: (newFilters) => {
                    set((state) => ({
                        filters: { ...state.filters, ...newFilters },
                    }));
                    get().resetNavigation();
                },

                clearFilters: () => {
                    set({ filters: {genres: [], languages: [], authors: [], ratings: []} });
                    get().resetNavigation();
                },

                toggleBookSelection: (bookId) => {
                    set((state) => {
                        const newSelected = new Set(state.selectedBooks);
                        if (newSelected.has(bookId)) {
                            newSelected.delete(bookId);
                        } else {
                            newSelected.add(bookId);
                        }
                        return { selectedBooks: newSelected };
                    });
                },

                clearSelection: () => {
                    set({ selectedBooks: new Set() });
                },

                setCurrentBookIndex: (index) => {
                    set({ currentBookIndex: Math.max(0, index) });
                },

                navigateToNextBook: () => {
                    set((state) => ({
                        currentBookIndex: state.currentBookIndex + 1
                    }));
                },

                navigateToPreviousBook: () => {
                    set((state) => ({
                        currentBookIndex: Math.max(0, state.currentBookIndex - 1)
                    }));
                },

                setBooksAreFetched: (input: boolean) => {
                    set({ booksAreFetched: input })
                },

                resetNavigation: () => {
                    set({ currentBookIndex: 0 });
                },
                resetBookStore: () => set({
                    filters: {genres: [], languages: [], authors: [], ratings: []},
                    selectedBooks: new Set(),
                    currentBookIndex: 0,
                    limit: 50,
                    booksAreFetched: false,
                }),
            }),
            {
                name: 'books-store',
                partialize: (state) => ({
                    filters: state.filters,
                    selectedBooks: Array.from(state.selectedBooks),
                    currentBookIndex: state.currentBookIndex,
                    limit: state.limit,
                }),
            }
        ),
    )
)