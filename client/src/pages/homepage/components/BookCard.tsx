import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, FileText, Languages, Star, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BookListItem } from "../../../types/book-types/bookTypes";
import Button from "../../../global-components/buttons/Button";
import { serverAssetUrl, useCoverPlaceholder } from "../../../utils/assets";
import { pickDescription } from "../../../utils/descriptions";
import { BOOK_RULES } from "../../../schemas/bookRules";

const SYNOPSIS_PREVIEW_LENGTH = 600;
const STARS = Array.from({ length: BOOK_RULES.ratingMax }, (_, index) => index + 1);

interface Props {
    book: BookListItem;
    onClose: () => void;
}

export default function BookCard({ book, onClose }: Props) {
    const { t, i18n } = useTranslation("front/books");
    const navigate = useNavigate();
    const placeholder = useCoverPlaceholder();
    const [expanded, setExpanded] = useState(false);
    const language = i18n.resolvedLanguage ?? "en";
    const titleId = `book-card-title-${book.id}`;

    const fullSynopsis = pickDescription(book.descriptions, language)?.synopsis ?? null;
    const isLong = Boolean(fullSynopsis && fullSynopsis.length > SYNOPSIS_PREVIEW_LENGTH);
    const synopsis = fullSynopsis && isLong && !expanded
        ? `${fullSynopsis.slice(0, SYNOPSIS_PREVIEW_LENGTH).trimEnd()}…`
        : fullSynopsis;
    const filledStars = book.average_rating === null ? 0 : Math.round(book.average_rating);
    const rating = book.average_rating === null
        ? t("card.noRatings")
        : t("card.ratingSummary", {
            count: book.ratings_count,
            rating: new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(book.average_rating),
        });

    return (
        <article aria-labelledby={titleId} className="h-full lg:h-auto lg:max-h-full flex flex-col overflow-hidden bg-panelLight dark:bg-panelDark text-fontPrimaryLight dark:text-fontPrimaryDark lg:rounded-panel lg:border lg:border-panelBorderLight lg:dark:border-panelBorderDark lg:shadow-soft-md lg:dark:shadow-deep-md">
            <header className="shrink-0 flex items-center gap-2 bg-primaryLight dark:bg-primaryDark px-3 py-1.5 sm:px-4 text-onPrimaryLight dark:text-onPrimaryDark shadow-soft-sm dark:shadow-deep-sm">
                <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate font-libre text-sm font-semibold">{t("card.heading")}</span>
                <Button variant="inverse" icon={X} aria-label={t("card.close")} onClick={onClose} className="min-h-10 min-w-10 -mr-1" />
            </header>

            <div className="min-h-0 overflow-y-auto flex flex-col gap-5 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                    <Link
                        to={`/book/${book.id}`}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="shrink-0 w-32 sm:w-36 xl:w-40"
                    >
                        <img
                            src={serverAssetUrl(book.cover_url) ?? placeholder}
                            alt=""
                            className="w-full aspect-[2/3] object-cover rounded-control bg-panelSelectedLight dark:bg-panelSelectedDark shadow-book dark:shadow-bookDark transition-transform duration-300 hover:-translate-y-1"
                        />
                    </Link>

                    <div className="min-w-0 w-full flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
                        <div className="min-w-0 w-full">
                            <h2 id={titleId} className="font-libre text-xl sm:text-2xl xl:text-3xl font-bold leading-tight break-words">
                                <Link
                                    to={`/book/${book.id}`}
                                    className="rounded-control hover:text-primaryLight dark:hover:text-primaryDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
                                >
                                    {book.title}
                                </Link>
                            </h2>
                            {book.author_name && (
                                <p className="mt-1 font-libre italic text-fontMutedLight dark:text-fontMutedDark break-words">
                                    {t("card.by", { author: book.author_name })}
                                </p>
                            )}
                        </div>

                        <dl className="flex flex-col items-center sm:items-start gap-3 font-libre text-sm">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
                                <dt className="sr-only">{t("card.rating")}</dt>
                                <dd className="flex items-center gap-0.5" aria-hidden="true">
                                    {STARS.map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${star <= filledStars
                                                ? "fill-ratingLight text-ratingLight dark:fill-ratingDark dark:text-ratingDark"
                                                : "text-ratingEmptyLight dark:text-ratingEmptyDark"}`}
                                        />
                                    ))}
                                </dd>
                                <dd className="text-fontMutedLight dark:text-fontMutedDark">{rating}</dd>
                            </div>

                            {(book.language_name || book.pages) && (
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                    {book.language_name && (
                                        <div className="inline-flex items-center gap-1.5 rounded-control bg-panelSelectedLight dark:bg-panelSelectedDark px-2.5 py-1">
                                            <Languages className="w-4 h-4 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                                            <dt className="sr-only">{t("card.language")}</dt>
                                            <dd>{book.language_name}</dd>
                                        </div>
                                    )}
                                    {book.pages && (
                                        <div className="inline-flex items-center gap-1.5 rounded-control bg-panelSelectedLight dark:bg-panelSelectedDark px-2.5 py-1">
                                            <FileText className="w-4 h-4 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                                            <dt className="sr-only">{t("card.pages")}</dt>
                                            <dd>{t("card.pageCount", { count: book.pages, pages: new Intl.NumberFormat(language).format(book.pages) })}</dd>
                                        </div>
                                    )}
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {book.genres.length > 0 && (
                    <section>
                        <h3 className="mb-2 font-libre text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
                            {t("card.genres")}
                        </h3>
                        <ul className="flex flex-wrap gap-2">
                            {book.genres.map((genre) => (
                                <li
                                    key={genre.id}
                                    className="rounded-control border border-countChipBorderLight dark:border-countChipBorderDark bg-countChipLight dark:bg-countChipDark px-2.5 py-1 font-libre text-xs text-countChipTextLight dark:text-countChipTextDark break-words"
                                >
                                    {genre.name}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {synopsis && (
                    <section>
                        <h3 className="mb-2 font-libre text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
                            {t("card.about")}
                        </h3>
                        <p className="font-libre text-sm leading-relaxed break-words whitespace-pre-line">{synopsis}</p>
                        {isLong && (
                            <Button variant="link" size="sm" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="mt-2 min-h-10">
                                {expanded ? t("card.showLess") : t("card.readMore")}
                            </Button>
                        )}
                    </section>
                )}

                <div className="pt-1">
                    <Button fullWidth rightIcon={ArrowRight} onClick={() => navigate(`/book/${book.id}`)}>
                        {t("card.viewBook")}
                    </Button>
                </div>
            </div>
        </article>
    );
}
