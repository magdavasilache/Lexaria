import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, X } from "lucide-react";
import Button from "../../../shared/components/Button";
import SelectField from "../../../shared/forms/fields/SelectField";
import { useBookReviews } from "../hooks/useBookReviews";
import { REVIEW_SORTS, ReviewSort } from "../reviewTypes";
import ReviewCard from "./ReviewCard";

interface Props {
    bookId: number;
    stars: number | null;
    onClearStars: () => void;
}

export default function ReviewsSection({ bookId, stars, onClearStars }: Props) {
    const { t } = useTranslation("front/reviews");
    const [sort, setSort] = useState<ReviewSort>("newest");
    const { reviews, total, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useBookReviews(bookId, sort, stars);

    return (
        <section id="reviews" aria-labelledby="reviews-heading" className="flex w-full scroll-mt-20 flex-col gap-4">
            <header className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 id="reviews-heading" className="font-libre text-xl font-semibold text-primaryLight dark:text-primaryDark sm:text-2xl">{t("section.title")}</h2>
                    {!isLoading && !isError && <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("section.count", { count: total })}</p>}
                </div>
                {(total > 1 || stars !== null) && (
                    <div className="w-full sm:w-48">
                        <SelectField
                            label={t("section.sort")}
                            hideLabel
                            tone="panel"
                            value={sort}
                            options={REVIEW_SORTS.map((value) => ({ value, label: t(`section.sortOptions.${value}`) }))}
                            onChange={setSort}
                        />
                    </div>
                )}
            </header>

            {stars !== null && (
                <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-control bg-panelSelectedLight px-2.5 py-1 font-medium text-primaryLight dark:bg-panelSelectedDark dark:text-primaryDark">
                        {t("section.filtered", { count: stars })}
                    </span>
                    <Button variant="ghost" size="sm" leftIcon={X} onClick={onClearStars} className="min-h-10">
                        {t("section.clearFilter")}
                    </Button>
                </p>
            )}

            {isLoading ? (
                <p role="status" className="py-6 text-center text-sm text-fontMutedLight dark:text-fontMutedDark">{t("section.loading")}</p>
            ) : isError ? (
                <p role="alert" className="py-6 text-center text-sm text-errorLight dark:text-errorDark">{t("section.loadError")}</p>
            ) : reviews.length === 0 ? (
                <p className="py-6 text-center text-sm text-fontMutedLight dark:text-fontMutedDark">{t(stars === null ? "section.empty" : "section.emptyFiltered")}</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                </div>
            )}

            {hasNextPage && (
                <Button variant="outline" leftIcon={ChevronDown} onClick={() => fetchNextPage()} loading={isFetchingNextPage} className="min-h-10 self-center">
                    {t("section.loadMore")}
                </Button>
            )}
        </section>
    );
}
