import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartColumn } from "lucide-react";
import Button from "../../../shared/components/Button";
import type { MonthBucket } from "../statsTypes";
import { useStatsFormat } from "../hooks/useStatsFormat";
import ColumnChart from "../../../shared/components/charts/ColumnChart";
import { CARD_TITLE, HINT, PANEL } from "./styles";

const METRICS = ["books", "pages", "time"] as const;
type Metric = (typeof METRICS)[number];
const MINUTES_PER_HOUR = 60;

const valueOf = (bucket: MonthBucket, metric: Metric) =>
    metric === "time" ? bucket.minutes / MINUTES_PER_HOUR : metric === "books" ? bucket.books : bucket.pages;

export default function MonthlyChart({ year, months, className = "" }: { year: number; months: MonthBucket[]; className?: string }) {
    const { t } = useTranslation("front/stats");
    const format = useStatsFormat();
    const captionId = useId();
    const [metric, setMetric] = useState<Metric>("books");
    const monthName = (month: number, style: "short" | "narrow" | "long") =>
        new Intl.DateTimeFormat(format.language, { month: style }).format(new Date(year, month - 1, 1));
    const display = (bucket: MonthBucket) =>
        metric === "time"
            ? bucket.minutes > 0 ? format.duration(bucket.minutes * 60) : format.amount("hours", 0)
            : format.amount(metric, metric === "books" ? bucket.books : bucket.pages);

    return (
        <section aria-labelledby={`${captionId}-title`} className={`${PANEL} flex min-w-0 flex-col gap-4 p-4 sm:p-5 ${className}`}>
            <header className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <ChartColumn className="h-5 w-5 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                    <h2 id={`${captionId}-title`} className={CARD_TITLE}>{t("chart.title")}</h2>
                </div>
                <div
                    role="group"
                    aria-label={t("chart.metricsLabel")}
                    className="flex w-full overflow-hidden rounded-control border border-primaryLight divide-x divide-primaryLight/40 dark:border-primaryDark dark:divide-primaryDark/40 sm:w-auto"
                >
                    {METRICS.map((option) => (
                        <Button
                            key={option}
                            variant="segment"
                            size="sm"
                            aria-pressed={metric === option}
                            onClick={() => setMetric(option)}
                            className="min-h-10 sm:px-4"
                        >
                            {t(`chart.metrics.${option}`)}
                        </Button>
                    ))}
                </div>
            </header>

            <p id={captionId} className={HINT}>{t(`chart.caption.${metric}`, { year })}</p>

            <ColumnChart
                labelledBy={captionId}
                formatTick={(tick) => format.number(tick, metric === "time" ? 1 : 0)}
                empty={t(`chart.empty.${metric}`, { year })}
                data={months.map((bucket) => ({
                    key: bucket.month,
                    value: valueOf(bucket, metric),
                    valueText: display(bucket),
                    label: monthName(bucket.month, "long"),
                    axisLabel: monthName(bucket.month, "short"),
                    compactAxisLabel: monthName(bucket.month, "narrow"),
                    ariaLabel: t("chart.bar", { month: monthName(bucket.month, "long"), value: display(bucket) }),
                }))}
            />

            <table className="sr-only">
                <caption>{t("chart.tableCaption", { year })}</caption>
                <thead>
                    <tr>
                        <th scope="col">{t("chart.table.month")}</th>
                        <th scope="col">{t("chart.table.books")}</th>
                        <th scope="col">{t("chart.table.pages")}</th>
                        <th scope="col">{t("chart.table.time")}</th>
                    </tr>
                </thead>
                <tbody>
                    {months.map((bucket) => (
                        <tr key={bucket.month}>
                            <th scope="row">{monthName(bucket.month, "long")}</th>
                            <td>{format.number(bucket.books)}</td>
                            <td>{format.number(bucket.pages)}</td>
                            <td>{format.number(bucket.minutes / MINUTES_PER_HOUR, 1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
