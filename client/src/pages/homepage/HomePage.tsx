import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBooks } from "../../api-handling/rtk-hooks/useBooks"
import BookThumbnail from "./components/BookThumbnail"
import { BookResponseBase } from "../../types/book-types/bookTypes";
import BookCard from "./components/BookCard";
import LoadingComponent from "./components/LoadingComponent";
import BookFilters from "./components/BooksFilters";
import { useThemeStore } from "../../state_management/useThemeStore";
import { THEME_COVER } from "../../utils/assets";

export default function HomePage() {
    const { t } = useTranslation("front/books")
    const theme = useThemeStore(state => state.theme)
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

    const showSkeletons = isLoading || (isFetching && books.length === 0)
    const showEmpty = !showSkeletons && books.length === 0

    return (
        <div className="w-full min-h-[calc(100dvh-60px)] flex flex-col lg:flex-row bg-backgroundLight dark:bg-backgroundDark">
            <aside className="w-full px-4 pt-4 sm:px-6 sm:pt-6 lg:w-auto lg:p-5 lg:sticky lg:top-[60px] lg:h-[calc(100dvh-60px)] lg:overflow-y-auto lg:shrink-0 lg:border-r lg:border-dividerLight lg:dark:border-dividerDark">
                <BookFilters />
            </aside>

            <main className={`min-w-0 w-full transition-all duration-500 ease-in-out ${selectedBook ? "lg:w-[55%]" : "lg:flex-1"}`}>
                <section className="relative h-40 sm:h-48 mx-4 mt-4 sm:mx-6 sm:mt-6 lg:mx-7 lg:mt-7 overflow-hidden rounded-panel shadow-sm">
                    <img
                        src={THEME_COVER[theme]}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover object-[center_55%]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/10" />
                    <div className="relative h-full flex flex-col justify-end gap-1 p-4 sm:p-6 text-onImage">
                        <h1 className="font-libre text-2xl sm:text-3xl">{t("home.title")}</h1>
                        <p className="font-libre text-sm opacity-90">{t("home.subtitle")}</p>
                    </div>
                </section>

                <div
                    aria-busy={showSkeletons}
                    className={`grid gap-3 sm:gap-4 p-4 sm:p-6 lg:p-7 grid-cols-2 sm:grid-cols-3 ${selectedBook ? "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"}`}
                >
                    {showSkeletons && <p className="sr-only" role="status">{t("home.loading")}</p>}
                    {showSkeletons ? (
                        Array.from({ length: 6 }).map((_, idx) => <LoadingComponent key={idx} />)
                    ) : (
                        books.map((book) => (
                            <BookThumbnail
                                key={book.id}
                                book={book}
                                isSelected={selectedBook?.id === book.id}
                                onSelect={handleSelectBook}
                            />
                        ))
                    )}
                    {showEmpty && (
                        <p className="col-span-full py-12 text-center font-libre text-fontMutedLight dark:text-fontMutedDark">
                            {t("home.empty")}
                        </p>
                    )}
                    <div ref={sentinelRef} className="col-span-full h-1" />
                    {isFetchingNextPage && (
                        <div className="col-span-full flex justify-center py-4">
                            <LoadingComponent />
                        </div>
                    )}
                </div>
            </main>

            {selectedBook && (
                <aside className="fixed inset-x-0 bottom-0 top-[60px] z-40 overflow-y-auto bg-backgroundLight dark:bg-backgroundDark lg:sticky lg:inset-auto lg:top-[60px] lg:z-auto lg:h-[calc(100dvh-60px)] lg:w-[45%] lg:shrink-0">
                    <div className={`min-h-full px-2 sm:px-4 shadow-sm ${isExiting ? 'animate-slide-out' : 'animate-slide-in'}`}>
                        <BookCard book={selectedBook} onClose={handleClose} />
                    </div>
                </aside>
            )}
        </div>
    );
}
