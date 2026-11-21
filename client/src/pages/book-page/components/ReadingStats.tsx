import { useTranslation } from "react-i18next";
import type { RatingBucket } from "../../../types/book-types/bookTypes";

interface Props {
    averageRating: number | null;
    ratingsCount: number;
    histogram: RatingBucket[];
}

export default function RatingStats({ averageRating, ratingsCount, histogram }: Props) {
    const { t, i18n } = useTranslation("front/books");
    const average = averageRating === null
        ? "–"
        : new Intl.NumberFormat(i18n.resolvedLanguage, { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(averageRating);

    return (
        <section
            aria-label={t("stats.title")}
            className="flex flex-col gap-5 w-full lg:w-72 bg-panelLight dark:bg-panelDark border border-panelBorderLight dark:border-panelBorderDark rounded-panel p-4 sm:p-5 shadow-soft-md dark:shadow-deep-md text-fontPrimaryLight dark:text-fontPrimaryDark"
        >
            <div className="flex flex-col items-center">
                <p className="text-3xl sm:text-4xl font-bold text-primaryLight dark:text-primaryDark">{average}</p>
                <p className="text-sm opacity-70">{t("stats.ratings", { count: ratingsCount })}</p>
            </div>

            <ul className="flex flex-col gap-2">
                {histogram.map((bucket) => {
                    const percent = ratingsCount ? (bucket.count / ratingsCount) * 100 : 0;
                    return (
                        <li key={bucket.stars} className="flex items-center gap-3">
                            <span className="w-8 text-sm" aria-label={t("stats.stars", { count: bucket.stars })}>{bucket.stars}★</span>
                            <div className="flex-1 h-2 bg-dividerLight dark:bg-dividerDark rounded-full" aria-hidden="true">
                                <div className="h-2 bg-primaryLight dark:bg-primaryDark rounded-full transition-all" style={{ width: `${percent}%` }} />
                            </div>
                            <span className="text-xs w-8 text-right tabular-nums">{bucket.count}</span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
