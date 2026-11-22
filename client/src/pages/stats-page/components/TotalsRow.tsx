import { useTranslation } from "react-i18next";
import type { StatsTotals } from "../../../types/stats-types/statsTypes";
import { useStatsFormat } from "../useStatsFormat";
import { FIGURE, HINT, LABEL, PANEL } from "./styles";

type Tile = { id: string; label: string; value: string; hint: string; className?: string };

export default function TotalsRow({ year, totals, allTimeBooks }: { year: number; totals: StatsTotals; allTimeBooks: number }) {
    const { t } = useTranslation("front/stats");
    const format = useStatsFormat();

    const tiles: Tile[] = [
        { id: "books", label: t("totals.books"), value: format.number(totals.books), hint: t("totals.allTime", { value: format.number(allTimeBooks) }) },
        { id: "pages", label: t("totals.pages"), value: format.number(totals.pages), hint: t("totals.pagesHint") },
        {
            id: "time",
            label: t("totals.time"),
            value: format.duration(totals.minutes * 60),
            hint: t("totals.sessions", { count: totals.sessions, value: format.number(totals.sessions) }),
        },
        { id: "days", label: t("totals.days"), value: format.number(totals.reading_days), hint: t("totals.daysHint") },
        {
            id: "rating",
            label: t("totals.rating"),
            value: totals.average_rating === null ? "–" : t("totals.ratingValue", { value: format.number(totals.average_rating, 2) }),
            hint: totals.average_rating === null ? t("totals.noRating") : t("totals.ratingHint"),
            className: "col-span-2 sm:col-span-1",
        },
    ];

    return (
        <section aria-label={t("totals.label", { year })}>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {tiles.map((tile) => (
                    <div key={tile.id} className={`${PANEL} flex min-w-0 flex-col gap-1 p-3 sm:p-4 ${tile.className ?? ""}`}>
                        <dt className={LABEL}>{tile.label}</dt>
                        <dd className={`${FIGURE} break-words`}>{tile.value}</dd>
                        <dd className={HINT}>{tile.hint}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
