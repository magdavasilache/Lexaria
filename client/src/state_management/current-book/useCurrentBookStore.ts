import { create } from "zustand";
import { ResponseBook } from "../../types/book-types/bookTypes";
import { booksAPI } from "../../api/booksAPI";
import { useUserBookStatusStore } from "../../api-handling/context/user_book_status/useUserBookStatusStore";

interface StoreState{
    currentBook: ResponseBook | null;
}

interface StoreActions{
    setCurrentBook: (input: ResponseBook) => void;
    fetchSelectedBook: (bookId: number) => Promise<void>;
}

export const useCurrentBookStore = create<StoreState & StoreActions>()(
    (set) => {
        return {
            currentBook: null,
            setCurrentBook(input) {
                set({currentBook: input})
            },
            async fetchSelectedBook(bookId: number) {
                try {
                    const response = await booksAPI.getBookById(bookId);
                    if (!response) {
                        throw new Error("Failed to fetch book data");
                    }
                    set({ currentBook: response });
                    useUserBookStatusStore.setState({userBookStatsus: response.user_book_status})
                } catch (error) {
                    console.error("Error fetching book:", error);
                }
            }
        }
    }
)
