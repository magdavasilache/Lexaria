import { useEffect } from "react"
import { useCurrentBookStore } from "../../state_management/current-book/useCurrentBookStore"
import ReviewForm from "../../forms/ReviewForm"
import ImageCarousel from "./components/ImageCarousel"
import StatusBookSetter from "./components/StatusBookSetter"
import { useParams } from "react-router-dom"
import ReadingStats from "./components/ReadingStats"
import ReviewsSection from "./components/review_section/ReviewsSection"
import { useBookReviews } from "../../api-handling/rtk-hooks/reviews/useGetBookReviews"

export default function BookPage() {
    const fetchBook = useCurrentBookStore(state => state.fetchSelectedBook)
    const currentBook = useCurrentBookStore(state => state.currentBook)
    const { id } = useParams<{ id: string }>()

    const bookId = id ? Number(id) : null

    if (!bookId) return null

    const { data: reviews, isLoading } = useBookReviews(bookId);

    useEffect(() => {
        if (bookId) {
            fetchBook(bookId)
        }
    }, [bookId, fetchBook])

    if (!currentBook) return null

    return (
        <div className="w-full min-h-screen flex flex-col overflow-auto bg-backgroundLight dark:bg-backgroundDark">

            <div className="flex justify-between w-full">

                <div className="flex flex-col w-[33%] p-6">
                    {currentBook.images && <ImageCarousel images={currentBook.images} />}
                    <StatusBookSetter />
                    <ReviewForm />
                </div>

                <div className="flex flex-col gap-8 p-6 mr-10 max-w-2xl text-fontPrimaryLight dark:text-fontPrimaryDark">

                    <div className="pb-4 border-b border-dividerLight dark:border-dividerDark">
                        <h1 className="text-4xl font-bold text-primaryLight dark:text-primaryDark">
                            {currentBook.title}
                        </h1>

                        <p className="text-lg mt-1 opacity-80 dark:text-fontSecondaryDark">
                            {currentBook.author_name}
                        </p>
                    </div>

                    <div className="
                            flex flex-wrap gap-4 text-sm
                            bg-paperLight dark:bg-paperDark
                            px-4 py-3 rounded-sm
                            border border-dividerLight dark:border-dividerDark
                            shadow-cardShadowLight dark:shadow-cardShadowDark
                        ">
                        {currentBook.pages && (
                            <span className="px-2 py-1 bg-inputLight dark:bg-inputDark rounded-sm">
                                {currentBook.pages} pages
                            </span>
                        )}

                        {currentBook.language_name && (
                            <span className="px-2 py-1 bg-inputLight dark:bg-inputDark rounded-sm">
                                {currentBook.language_name}
                            </span>
                        )}

                        {currentBook.country_name && (
                            <span className="px-2 py-1 bg-inputLight dark:bg-inputDark rounded-sm">
                                {currentBook.country_name}
                            </span>
                        )}

                        {currentBook.published_at && (
                            <span className="px-2 py-1 bg-inputLight dark:bg-inputDark rounded-sm">
                                {new Date(currentBook.published_at).getFullYear()}
                            </span>
                        )}
                    </div>

                    {currentBook.synopsis && (
                        <div className="flex flex-col gap-3">
                            <h2 className="text-lg font-semibold text-primaryLight dark:text-primaryDark">
                                Synopsis
                            </h2>

                            <p className="
                                leading-relaxed
                                bg-inputLight dark:bg-inputDark
                                p-4 rounded-sm
                                border border-dividerLight dark:border-dividerDark
                            ">
                                {currentBook.synopsis}
                            </p>
                        </div>
                    )}

                    {currentBook.characters?.length ? (
                        <div className="flex flex-col gap-3">
                            <h2 className="text-lg font-semibold text-primaryLight dark:text-primaryDark">
                                Characters
                            </h2>

                            <div className="flex flex-wrap gap-2">
                                {currentBook.characters.map((c: string) => (
                                    <span
                                        key={c}
                                        className="
                        px-3 py-1 text-xs font-medium
                        bg-primaryLightTone dark:bg-primaryDarkLightTone
                        text-primaryLightDarkTone dark:text-primaryDarkDarkTone
                        rounded-full
                    "
                                    >
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {currentBook.settings?.length ? (
                        <div className="flex flex-col gap-3">
                            <h2 className="text-lg font-semibold text-primaryLight dark:text-primaryDark">
                                Settings
                            </h2>

                            <div className="flex flex-wrap gap-2">
                                {currentBook.settings.map((s: string) => (
                                    <span
                                        key={s}
                                        className="
                        px-3 py-1 text-xs font-medium
                        bg-secondaryLightLightTone dark:bg-secondaryDarkLightTone
                        text-fontPrimaryLight dark:text-fontPrimaryDark
                        rounded-full
                    "
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}

                </div>

                <div className="mr-5 p-6">
                    <ReadingStats />
                </div>
            </div>

            <div>
                {reviews && <ReviewsSection reviews={reviews} isLoading={isLoading} />}
            </div>
        </div>
    )
}