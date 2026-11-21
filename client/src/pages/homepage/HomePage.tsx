import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { useBooks } from "../../api-handling/rtk-hooks/books/useBooks"
import BookThumbnail from "./components/BookThumbnail"
import type { BookListItem } from "../../types/book-types/bookTypes";
import BookCard from "./components/BookCard";
import LoadingComponent from "./components/LoadingComponent";
import BookFilters from "./components/BooksFilters";
import { useThemeStore } from "../../state_management/useThemeStore";
import { THEME_COVER } from "../../utils/assets";
import { useDocumentTitle } from "../../utils/useDocumentTitle";

const EXIT_DURATION = 350;

export default function HomePage() {
    const { t, i18n } = useTranslation("front/books")
    useDocumentTitle(t("pageTitle.home", { ns: "front/common" }))
    const theme = useThemeStore(state => state.theme)
    const [selectedBook, setSelectedBook] = useState<BookListItem | null>(null);
    const [isExiting, setIsExiting] = useState<boolean>(false)
    const { books, totalCount, isFetching, isLoading, isError, sentinelRef, isFetchingNextPage } = useBooks();
    const selectedIdRef = useRef<number | null>(null)
    const exitTimerRef = useRef<number | undefined>(undefined)
    const returnFocusRef = useRef<HTMLElement | null>(null)
    const panelRef = useRef<HTMLElement | null>(null)

    const handleClose = useCallback(() => {
        selectedIdRef.current = null
        setIsExiting(true)
        window.clearTimeout(exitTimerRef.current)
        exitTimerRef.current = window.setTimeout(() => {
            setSelectedBook(null)
            setIsExiting(false)
            returnFocusRef.current?.focus({ preventScroll: true })
        }, EXIT_DURATION)
    }, [])

    const handleSelectBook = useCallback((book: BookListItem) => {
        if (selectedIdRef.current === book.id) {
            handleClose()
            return
        }
        window.clearTimeout(exitTimerRef.current)
        if (selectedIdRef.current === null) returnFocusRef.current = document.activeElement as HTMLElement | null
        selectedIdRef.current = book.id
        setIsExiting(false)
        setSelectedBook(book)
    }, [handleClose])

    const isOpen = selectedBook !== null

    useEffect(() => {
        if (!isOpen) return
        panelRef.current?.focus({ preventScroll: true })
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") handleClose()
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [isOpen, handleClose])

    useEffect(() => () => window.clearTimeout(exitTimerRef.current), [])

    const showSkeletons = isLoading || (isFetching && books.length === 0)
    const showEmpty = !showSkeletons && !isError && books.length === 0

    return (
        <div className="w-full min-h-[calc(100dvh-60px)] flex flex-col lg:flex-row bg-backgroundLight dark:bg-backgroundDark">
            <aside className="w-full px-4 pt-4 sm:px-6 sm:pt-6 lg:w-auto lg:py-7 lg:pl-7 lg:pr-0 lg:sticky lg:top-[60px] lg:max-h-[calc(100dvh-60px)] lg:overflow-y-auto lg:shrink-0">
                <BookFilters />
            </aside>

            <main className="min-w-0 flex-1">
                <section className="relative isolate flex min-h-36 sm:min-h-40 lg:min-h-44 mx-4 mt-4 sm:mx-6 sm:mt-6 lg:mx-7 lg:mt-7 overflow-hidden rounded-panel shadow-soft-md dark:shadow-deep-md ring-1 ring-black/5 dark:ring-white/5">
                    <img
                        src={THEME_COVER[theme]}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 -z-10 w-full h-full object-cover object-[center_55%]"
                    />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/40 to-black/0" />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
                    <div className="w-full flex flex-col justify-end items-start gap-2 p-4 sm:p-5 lg:px-6 text-onImage">
                        {!showSkeletons && totalCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-control border border-white/20 bg-white/10 px-2.5 py-1 font-libre text-xs backdrop-blur-sm animate-fade-in">
                                <BookOpen className="w-3.5 h-3.5 text-gold-300" aria-hidden="true" />
                                {t("home.count", { count: totalCount, total: new Intl.NumberFormat(i18n.resolvedLanguage).format(totalCount) })}
                            </span>
                        )}
                        <div className="max-w-2xl">
                            <h1 className="font-explora text-2xl sm:text-3xl lg:text-4xl leading-tight drop-shadow-deep">{t("home.title")}</h1>
                            <span className="mt-1.5 block h-0.5 w-14 sm:w-16 rounded-full bg-gold-foil" aria-hidden="true" />
                        </div>
                        <p className="font-libre text-sm opacity-90 max-w-xl">{t("home.subtitle")}</p>
                    </div>
                </section>

                <div
                    aria-busy={showSkeletons}
                    className={`grid gap-3 sm:gap-4 p-4 sm:p-6 lg:p-7 grid-cols-2 sm:grid-cols-3 ${isOpen ? "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"}`}
                >
                    {showSkeletons && <p className="sr-only" role="status">{t("home.loading")}</p>}
                    {showSkeletons ? (
                        Array.from({ length: 6 }).map((_, idx) => <LoadingComponent key={idx} />)
                    ) : (
                        books.map((book) => (
                            <BookThumbnail
                                key={book.id}
                                book={book}
                                isSelected={selectedBook?.id === book.id && !isExiting}
                                onSelect={handleSelectBook}
                            />
                        ))
                    )}
                    {isError && books.length === 0 && (
                        <p role="alert" className="col-span-full py-12 text-center font-libre text-errorLight dark:text-errorDark">
                            {t("home.loadError")}
                        </p>
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
                <aside
                    ref={panelRef}
                    tabIndex={-1}
                    className={`fixed inset-x-0 bottom-0 top-[60px] z-40 focus:outline-none lg:sticky lg:inset-auto lg:top-[60px] lg:z-auto lg:h-[calc(100dvh-60px)] lg:w-[40%] xl:w-[34%] 2xl:w-[30%] lg:shrink-0 lg:py-7 lg:pr-7 ${isExiting ? "animate-slide-out" : "animate-slide-in"}`}
                >
                    <div key={selectedBook.id} className="h-full animate-fade-in">
                        <BookCard book={selectedBook} onClose={handleClose} />
                    </div>
                </aside>
            )}
        </div>
    );
}
