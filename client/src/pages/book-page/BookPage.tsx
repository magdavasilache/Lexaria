import { ReactNode, useLayoutEffect, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Award, CalendarDays, ChevronDown, FileText, Languages, Layers, LucideIcon, MapPin, Star } from "lucide-react"
import ReviewForm from "../../forms/ReviewForm"
import Button from "../../global-components/buttons/Button"
import { StarsDisplay } from "../../forms/components/RatingField"
import ImageCarousel from "./components/ImageCarousel"
import StatusBookSetter from "./components/StatusBookSetter"
import ReadingStats from "./components/ReadingStats"
import ReaderTags from "./components/ReaderTags"
import ReviewsSection from "./components/review_section/ReviewsSection"
import { useBook } from "../../api-handling/rtk-hooks/books/useBook"
import { useMyReview } from "../../api-handling/rtk-hooks/reviews/useBookReviews"
import { useBooksStore } from "../../state_management/useBooksStore"
import type { BookDetail } from "../../types/book-types/bookTypes"
import { PAGE_CONTAINER } from "../../utils/layout"
import { languageName, pickDescription } from "../../utils/descriptions"
import { useDocumentTitle } from "../../utils/useDocumentTitle"

const CHIP = "px-2.5 py-1 text-xs font-medium rounded-control break-words"
const SECTION_HEADING = "text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark"
const PANEL = "rounded-panel border border-panelBorderLight bg-panelLight shadow-soft-md dark:border-panelBorderDark dark:bg-panelDark dark:shadow-deep-md"
const STICKY = "md:sticky md:top-[76px] md:self-start"

export default function BookPage() {
    const { t } = useTranslation("front/books")
    const { id } = useParams<{ id: string }>()
    const parsed = Number(id)
    const bookId = Number.isInteger(parsed) && parsed > 0 ? parsed : null
    const { data: book, isLoading, isError } = useBook(bookId)
    const [stars, setStars] = useState<number | null>(null)
    useDocumentTitle(book?.title ?? t("pageTitle.book", { ns: "front/common" }))

    if (bookId === null || isError) {
        return <p className="p-6 text-center font-libre text-fontMutedLight dark:text-fontMutedDark">{t("page.notFound")}</p>
    }
    if (isLoading || !book) {
        return <p role="status" className="p-6 text-center font-libre text-fontMutedLight dark:text-fontMutedDark">{t("page.loading")}</p>
    }

    const selectStars = (value: number | null) => {
        setStars(value)
        document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const sidebar = (
        <div className="flex flex-col gap-4">
            <ReadingStats
                averageRating={book.average_rating}
                ratingsCount={book.ratings_count}
                histogram={book.rating_histogram}
                activeStars={stars}
                onSelectStars={selectStars}
            />
            <ReaderTags tags={book.reader_tags} />
        </div>
    )

    return (
        <div className="w-full min-h-[calc(100dvh-60px)] bg-backgroundLight dark:bg-backgroundDark text-fontPrimaryLight dark:text-fontPrimaryDark">
            <div className={`${PAGE_CONTAINER} grid gap-6 py-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8 lg:grid-cols-[14rem_minmax(0,1fr)_18rem] lg:py-8 xl:grid-cols-[16rem_minmax(0,1fr)_22rem] xl:gap-10 2xl:grid-cols-[18rem_minmax(0,1fr)_26rem] 2xl:gap-12`}>
                <aside className={`flex flex-col gap-3 ${STICKY}`}>
                    <div className="mx-auto w-40 sm:w-48 md:w-full">
                        <ImageCarousel title={book.title} imageUrls={book.image_urls} />
                    </div>
                    <StatusBookSetter bookId={book.id} status={book.user_book_status?.status} />
                    <ReviewForm bookId={book.id} />
                    <MyRating bookId={book.id} />
                </aside>

                <main className="flex min-w-0 flex-col gap-6">
                    <article className={`${PANEL} flex flex-col divide-y divide-panelBorderLight dark:divide-panelBorderDark`}>
                        <BookHeader book={book} />
                        <Synopsis book={book} />
                        <BookDetails book={book} />
                    </article>
                    <div className="lg:hidden">{sidebar}</div>
                    <ReviewsSection bookId={book.id} stars={stars} onClearStars={() => setStars(null)} />
                </main>

                <aside className={`hidden lg:block ${STICKY}`}>{sidebar}</aside>
            </div>
        </div>
    )
}

type Fact = { icon: LucideIcon; label: string }

function BookHeader({ book }: { book: BookDetail }) {
    const { t, i18n } = useTranslation("front/books")
    const clearFilters = useBooksStore((state) => state.clearFilters)
    const setFilters = useBooksStore((state) => state.setFilters)
    const language = i18n.resolvedLanguage ?? "en"
    const facts = [
        book.is_series ? { icon: Layers, label: t("page.series") } : null,
        book.pages ? { icon: FileText, label: t("page.pages", { count: book.pages }) } : null,
        book.language_name ? { icon: Languages, label: book.language_name } : null,
        book.country_name ? { icon: MapPin, label: book.country_name } : null,
        book.published_at
            ? { icon: CalendarDays, label: t("page.published", { year: new Intl.DateTimeFormat(language, { year: "numeric" }).format(new Date(book.published_at)) }) }
            : null,
    ].filter((fact): fact is Fact => fact !== null)
    const rating = book.average_rating === null
        ? null
        : t("card.ratingSummary", {
            count: book.ratings_count,
            rating: new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(book.average_rating),
        })

    return (
        <header className="flex flex-col gap-3 p-4 sm:p-6">
            <Link
                to="/homepage"
                className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm text-fontMutedLight hover:text-primaryLight dark:text-fontMutedDark dark:hover:text-primaryDark rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
            >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t("page.back")}
            </Link>
            <div className="flex flex-col gap-1">
                <h1 className="font-libre text-2xl font-bold leading-tight break-words text-primaryLight dark:text-primaryDark sm:text-3xl lg:text-4xl">{book.title}</h1>
                {book.author_name && book.author_id && (
                    <p className="text-base italic sm:text-lg">
                        {t("page.byPrefix")}{" "}
                        <Link
                            to="/homepage"
                            onClick={() => {
                                clearFilters()
                                setFilters({ author_ids: [book.author_id as number] })
                            }}
                            aria-label={t("page.authorLink", { author: book.author_name })}
                            className="font-semibold not-italic underline-offset-4 hover:underline hover:text-primaryLight dark:hover:text-primaryDark rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
                        >
                            {book.author_name}
                        </Link>
                    </p>
                )}
            </div>
            {rating && (
                <a
                    href="#reviews"
                    className="inline-flex min-h-10 flex-wrap items-center gap-2 self-start text-sm text-fontMutedLight hover:text-primaryLight dark:text-fontMutedDark dark:hover:text-primaryDark rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
                >
                    <Star className="h-4 w-4 fill-ratingLight text-ratingLight dark:fill-ratingDark dark:text-ratingDark" aria-hidden="true" />
                    {rating}
                </a>
            )}
            {facts.length > 0 && (
                <ul className="flex flex-wrap gap-2 text-sm">
                    {facts.map(({ icon: Icon, label }) => (
                        <li key={label} className="inline-flex items-center gap-1.5 rounded-control bg-panelSelectedLight px-2.5 py-1 dark:bg-panelSelectedDark">
                            <Icon className="h-4 w-4 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                            {label}
                        </li>
                    ))}
                </ul>
            )}
        </header>
    )
}

function Synopsis({ book }: { book: BookDetail }) {
    const { t, i18n } = useTranslation("front/books")
    const language = i18n.resolvedLanguage ?? "en"
    const description = pickDescription(book.descriptions, language)
    const text = description?.synopsis ?? ""
    const ref = useRef<HTMLParagraphElement>(null)
    const [expanded, setExpanded] = useState(false)
    const [overflowing, setOverflowing] = useState(false)

    useLayoutEffect(() => {
        const element = ref.current
        if (!element || expanded) return
        const measure = () => setOverflowing(element.scrollHeight > element.clientHeight + 1)
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [text, expanded])

    if (!description) return null

    return (
        <section className="flex flex-col gap-2 p-4 sm:p-6">
            <h2 className={SECTION_HEADING}>{t("page.synopsis")}</h2>
            {description.language.split("-")[0] !== language.split("-")[0] && (
                <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">
                    {t("page.synopsisLanguage", { language: languageName(description.language, language) })}
                </p>
            )}
            <p lang={description.language} id="synopsis-text" ref={ref} className={`whitespace-pre-line break-words leading-relaxed ${expanded ? "" : "line-clamp-6"}`}>{text}</p>
            {(overflowing || expanded) && (
                <Button
                    variant="link"
                    size="sm"
                    rightIcon={ChevronDown}
                    iconClassName={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                    aria-expanded={expanded}
                    aria-controls="synopsis-text"
                    onClick={() => setExpanded((value) => !value)}
                    className="min-h-10 self-start px-0"
                >
                    {t(expanded ? "page.readLess" : "page.readMore")}
                </Button>
            )}
        </section>
    )
}

function BookDetails({ book }: { book: BookDetail }) {
    const { t } = useTranslation("front/books")
    const tone = "bg-primaryLightTone dark:bg-primaryDarkLightTone text-primaryLightDarkTone dark:text-primaryDarkDarkTone"
    const genreTone = "border border-countChipBorderLight dark:border-countChipBorderDark bg-countChipLight dark:bg-countChipDark text-countChipTextLight dark:text-countChipTextDark"
    const hasDetails = book.genres.length + book.characters.length + book.settings.length + book.awards.length > 0
    if (!hasDetails) return null

    return (
        <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
            {book.genres.length > 0 && (
                <ChipSection title={t("page.genres")}>
                    {book.genres.map((genre) => <span key={genre.id} className={`${CHIP} ${genreTone}`}>{genre.name}</span>)}
                </ChipSection>
            )}
            {book.characters.length > 0 && (
                <ChipSection title={t("page.characters")}>
                    {book.characters.map((name) => <span key={name} className={`${CHIP} ${tone}`}>{name}</span>)}
                </ChipSection>
            )}
            {book.settings.length > 0 && (
                <ChipSection title={t("page.settings")}>
                    {book.settings.map((place) => <span key={place} className={`${CHIP} bg-secondaryLightLightTone dark:bg-secondaryDarkLightTone text-onSecondaryLight dark:text-onSecondaryDark`}>{place}</span>)}
                </ChipSection>
            )}
            {book.awards.length > 0 && (
                <ChipSection title={t("page.awards")}>
                    {book.awards.map((award) => <span key={award.id} className={`${CHIP} inline-flex items-center gap-1.5 border border-secondaryLight/50 dark:border-secondaryDark/30 bg-secondaryLightLightTone/60 dark:bg-transparent`}><Award className="h-3.5 w-3.5 shrink-0 text-secondaryLightDarkTone dark:text-ratingDark" aria-hidden="true" />{award.year ? `${award.name} (${award.year})` : award.name}</span>)}
                </ChipSection>
            )}
        </div>
    )
}

function ChipSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-2">
            <h2 className={SECTION_HEADING}>{title}</h2>
            <div className="flex flex-wrap gap-2">{children}</div>
        </section>
    )
}

function MyRating({ bookId }: { bookId: number }) {
    const { t, i18n } = useTranslation("front/books")
    const { data: review } = useMyReview(bookId)
    if (!review || review.rating === null) return null

    return (
        <p className={`${PANEL} flex flex-wrap items-center justify-center gap-2 px-3 py-2 text-sm`}>
            <span className="text-fontMutedLight dark:text-fontMutedDark">{t("page.yourRating")}</span>
            <StarsDisplay value={review.rating} />
            <span className="font-semibold tabular-nums">{new Intl.NumberFormat(i18n.resolvedLanguage).format(review.rating)}</span>
        </p>
    )
}
