import { useCallback, useMemo, useState } from "react";
import { useBooks } from "../../api-handling/rtk-hooks/useBooks"
import BookThumbnail from "./components/BookThumbnail"
import { BookResponseBase } from "../../types/book-types/bookTypes";
import BookCard from "./components/BookCard";
import LoadingComponent from "./components/LoadingComponent";
import BookFilters from "./components/BooksFilters";

export default function HomePage() {
    const [selectedBook, setSelectedBook] = useState<BookResponseBase | null>(null);
    const [isExiting, setIsExiting] = useState<boolean>(false)
    const { books, isFetching, isLoading, sentinelRef, isFetchingNextPage } = useBooks();

    const handleSelectBook = useCallback((book: BookResponseBase) => {
        setSelectedBook(book)
    }, [])

    const handleClose = useCallback(() => {
        setIsExiting(true)
        setTimeout(() => {
            setSelectedBook(null)
            setIsExiting(false)
        }, 400)
    }, [])

    const gridClass = useMemo(
        () =>
            `transition-all duration-500 ease-in-out ${selectedBook ? "w-[55%] grid-cols-4" : "w-full grid-cols-6"
            } grid gap-1 p-7`,
        [selectedBook]
    );

    return (
        <div className="w-full h-screen flex overflow-auto bg-backgroundLight dark:bg-backgroundDark">
            <aside className="sticky top-0 h-screen overflow-y-auto shrink-0 p-5 border-r border-dividerLight dark:border-dividerDark">
                <BookFilters />
            </aside>
            <div className={gridClass}>
                {(isLoading || (isFetching && books.length === 0)) ? (
                    Array.from({ length: 6 }).map((_, idx) => <LoadingComponent key={idx} />)
                ) : (
                    books.map((book) => (
                        <div
                            key={book.id}
                            className="cursor-pointer transition-transform duration-300 hover:scale-105"
                        >
                            <BookThumbnail
                                book={book}
                                isSelected={!!selectedBook}
                                onSelect={handleSelectBook}
                            />
                        </div>
                    ))
                )}
                <div ref={sentinelRef} className="col-span-full h-1" />
                {isFetchingNextPage && (
                    <div className="col-span-full flex justify-center py-4">
                        <LoadingComponent />
                    </div>
                )}
            </div>

            {selectedBook && (
                <aside className="sticky top-0 h-screen overflow-y-auto shrink-0 w-[45%]">
                    <div className={`h-full px-4 shadow-sm ${isExiting ? 'animate-slide-out' : 'animate-slide-in'}`}>
                        <BookCard book={selectedBook} onClose={handleClose} />
                    </div>
                </aside>
            )}

        </div>
    );
}

