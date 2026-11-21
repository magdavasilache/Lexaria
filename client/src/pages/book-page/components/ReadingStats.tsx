import { useTranslation } from "react-i18next";
import Button from "../../../global-components/buttons/Button";
import { StarsDisplay } from "../../../forms/components/RatingField";
import type { RatingBucket } from "../../../types/book-types/bookTypes";

interface Props {
    averageRating: number | null;
    ratingsCount: number;
    histogram: RatingBucket[];
    activeStars: number | null;
    onSelectStars: (stars: number | null) => void;
}

export default function RatingStats({ averageRating, ratingsCount, histogram, activeStars, onSelectStars }: Props) {
    const { t, i18n } = useTranslation("front/books");
    const average = averageRating === null
        ? "–"
        : new Intl.NumberFormat(i18n.resolvedLanguage, { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(averageRating);

    return (
        <section
            aria-labelledby="ratings-heading"
            className="flex w-full flex-col gap-4 rounded-panel border border-panelBorderLight bg-panelLight p-4 text-fontPrimaryLight shadow-soft-md dark:border-panelBorderDark dark:bg-panelDark dark:text-fontPrimaryDark dark:shadow-deep-md sm:p-5"
        >
            <h2 id="ratings-heading" className="text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">{t("stats.title")}</h2>
            <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-primaryLight dark:text-primaryDark sm:text-4xl">{average}</p>
                <div className="flex flex-col gap-1">
                    {averageRating !== null && <StarsDisplay value={averageRating} />}
                    <a href="#reviews" className="text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark rounded-control">
                        {t("stats.ratings", { count: ratingsCount })}
                    </a>
                </div>
            </div>

            {ratingsCount > 0 && (
                <ul className="flex flex-col gap-0.5">
                    {histogram.map((bucket) => {
                        const percent = (bucket.count / ratingsCount) * 100;
                        const active = activeStars === bucket.stars;
                        return (
                            <li key={bucket.stars}>
                                <Button
                                    variant="option"
                                    size="sm"
                                    fullWidth
                                    aria-pressed={active}
                                    aria-label={t("stats.filter", { count: bucket.stars })}
                                    onClick={() => onSelectStars(active ? null : bucket.stars)}
                                    className="min-h-10"
                                >
                                    <span className="flex h-full w-full items-center gap-3" aria-hidden="true">
                                        <span className="w-7 shrink-0 text-left text-sm tabular-nums">{bucket.stars}★</span>
                                        <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-dividerLight dark:bg-dividerDark">
                                            <span className="block h-full rounded-full bg-primaryLight transition-all dark:bg-primaryDark" style={{ width: `${percent}%` }} />
                                        </span>
                                        <span className="w-6 shrink-0 text-right text-xs tabular-nums">{bucket.count}</span>
                                    </span>
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
