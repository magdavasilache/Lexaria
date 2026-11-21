import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import ReviewForm from "../../forms/ReviewForm"
import ImageCarousel from "./components/ImageCarousel"
import StatusBookSetter from "./components/StatusBookSetter"
import ReadingStats from "./components/ReadingStats"
import ReviewsSection from "./components/review_section/ReviewsSection"
import { useBookReviews } from "../../api-handling/rtk-hooks/reviews/useGetBookReviews"
import { useBook } from "../../api-handling/rtk-hooks/books/useBook"

const CHIP = "px-3 py-1 text-xs font-medium rounded-full break-words"

export default function BookPage() {
    const { t, i18n } = useTranslation("front/books")
    const { id } = useParams<{ id: string }>()
    const parsed = Number(id)
    const bookId = Number.isInteger(parsed) && parsed > 0 ? parsed : null
    const { data: book, isLoading, isError } = useBook(bookId)
    const { data: reviews, isLoading: reviewsLoading } = useBookReviews(bookId ?? 0)

    if (bookId === null || isError) {
        return <p className="p-6 text-center font-libre text-fontMutedLight dark:text-fontMutedDark">{t("page.notFound")}</p>
    }
    if (isLoading || !book) {
        return <p role="status" className="p-6 text-center font-libre text-fontMutedLight dark:text-fontMutedDark">{t("page.loading")}</p>
    }

    const facts = [
        book.pages ? t("page.pages", { count: book.pages }) : null,
        book.language_name,
        book.country_name,
        book.published_at ? new Intl.DateTimeFormat(i18n.resolvedLanguage, { year: "numeric" }).format(new Date(book.published_at)) : null,
    ].filter(Boolean)

    return (
        <div className="w-full min-h-screen flex flex-col bg-backgroundLight dark:bg-backgroundDark">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 lg:w-72 lg:shrink-0">
                    <ImageCarousel title={book.title} imageUrls={book.image_urls} />
                    <StatusBookSetter bookId={book.id} status={book.user_book_status?.status} />
                    <ReviewForm bookId={book.id} />
                </div>

                <div className="flex flex-col gap-6 min-w-0 flex-1 max-w-2xl text-fontPrimaryLight dark:text-fontPrimaryDark">
                    <header className="pb-4 border-b border-dividerLight dark:border-dividerDark">
                        <h1 className="font-libre text-2xl sm:text-3xl lg:text-4xl font-bold text-primaryLight dark:text-primaryDark break-words">{book.title}</h1>
                        {book.author_name && <p className="text-base sm:text-lg mt-1 opacity-80">{t("card.by", { author: book.author_name })}</p>}
                    </header>

                    {facts.length > 0 && (
                        <ul className="flex flex-wrap gap-2 text-sm">
                            {facts.map((fact) => (
                                <li key={fact} className="px-2 py-1 rounded-control bg-panelLight dark:bg-panelDark border border-panelBorderLight dark:border-panelBorderDark">{fact}</li>
                            ))}
                        </ul>
                    )}

                    {book.genres.length > 0 && (
                        <Section title={t("page.genres")}>
                            {book.genres.map((genre) => <span key={genre.id} className={`${CHIP} bg-primaryLightTone dark:bg-primaryDarkLightTone text-primaryLightDarkTone dark:text-primaryDarkDarkTone`}>{genre.name}</span>)}
                        </Section>
                    )}

                    {book.synopsis && (
                        <section className="flex flex-col gap-2">
                            <h2 className="text-lg font-semibold text-primaryLight dark:text-primaryDark">{t("page.synopsis")}</h2>
                            <p className="leading-relaxed whitespace-pre-line break-words">{book.synopsis}</p>
                        </section>
                    )}

                    {book.characters.length > 0 && (
                        <Section title={t("page.characters")}>
                            {book.characters.map((name) => <span key={name} className={`${CHIP} bg-primaryLightTone dark:bg-primaryDarkLightTone text-primaryLightDarkTone dark:text-primaryDarkDarkTone`}>{name}</span>)}
                        </Section>
                    )}

                    {book.settings.length > 0 && (
                        <Section title={t("page.settings")}>
                            {book.settings.map((place) => <span key={place} className={`${CHIP} bg-secondaryLightLightTone dark:bg-secondaryDarkLightTone text-onSecondaryLight dark:text-onSecondaryDark`}>{place}</span>)}
                        </Section>
                    )}

                    {book.awards.length > 0 && (
                        <Section title={t("page.awards")}>
                            {book.awards.map((award) => <span key={award.id} className={`${CHIP} border border-panelBorderLight dark:border-panelBorderDark`}>{award.year ? `${award.name} (${award.year})` : award.name}</span>)}
                        </Section>
                    )}
                </div>

                <div className="lg:shrink-0">
                    <ReadingStats averageRating={book.average_rating} ratingsCount={book.ratings_count} histogram={book.rating_histogram} />
                </div>
            </div>

            {reviews && <ReviewsSection reviews={reviews} isLoading={reviewsLoading} />}
        </div>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-primaryLight dark:text-primaryDark">{title}</h2>
            <div className="flex flex-wrap gap-2">{children}</div>
        </section>
    )
}
