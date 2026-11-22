import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartColumn } from "lucide-react";
import Button from "../../../global-components/buttons/Button";
import type { MonthBucket } from "../../../types/stats-types/statsTypes";
import { useStatsFormat } from "../useStatsFormat";
import MarkTooltip from "./MarkTooltip";
import { CARD_TITLE, HINT, PANEL } from "./styles";

const METRICS = ["books", "pages", "time"] as const;
type Metric = (typeof METRICS)[number];
const TICK_COUNT = 3;
const MINUTES_PER_HOUR = 60;

const niceStep = (max: number) => {
    const raw = max / TICK_COUNT;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= raw) ?? raw;
    return Math.max(step, 1);
};

const valueOf = (bucket: MonthBucket, metric: Metric) =>
    metric === "time" ? bucket.minutes / MINUTES_PER_HOUR : metric === "books" ? bucket.books : bucket.pages;

export default function MonthlyChart({ year, months, className = "" }: { year: number; months: MonthBucket[]; className?: string }) {
    const { t } = useTranslation("front/stats");
    const format = useStatsFormat();
    const captionId = useId();
    const [metric, setMetric] = useState<Metric>("books");
    const [active, setActive] = useState<number | null>(null);

    const values = months.map((bucket) => valueOf(bucket, metric));
    const max = Math.max(...values);
    const step = niceStep(max);
    const top = Math.max(step, Math.ceil(max / step) * step);
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);
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

            {max === 0 ? (
                <p className="flex h-40 items-center justify-center rounded-panel bg-panelHoverLight/60 px-4 text-center text-sm text-fontMutedLight dark:bg-panelHoverDark/40 dark:text-fontMutedDark sm:h-48">
                    {t(`chart.empty.${metric}`, { year })}
                </p>
            ) : (
                <div className="flex gap-2">
                    <div className="relative h-40 w-8 shrink-0 sm:h-48 sm:w-10" aria-hidden="true">
                        {ticks.map((tick) => (
                            <span
                                key={tick}
                                className="absolute right-0 translate-y-1/2 text-[0.7rem] tabular-nums text-fontMutedLight dark:text-fontMutedDark"
                                style={{ bottom: `${(tick / top) * 100}%` }}
                            >
                                {format.number(tick, metric === "time" ? 1 : 0)}
                            </span>
                        ))}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="relative h-40 sm:h-48">
                            {ticks.map((tick) => (
                                <span
                                    key={tick}
                                    aria-hidden="true"
                                    className="absolute inset-x-0 h-px bg-dividerLight dark:bg-dividerDark"
                                    style={{ bottom: `${(tick / top) * 100}%` }}
                                />
                            ))}
                            <ol aria-labelledby={captionId} className="relative flex h-full items-end gap-0.5" onMouseLeave={() => setActive(null)}>
                                {months.map((bucket, index) => {
                                    const value = values[index];
                                    const label = t("chart.bar", { month: monthName(bucket.month, "long"), value: display(bucket) });
                                    const isActive = active === index;
                                    return (
                                        <li
                                            key={bucket.month}
                                            tabIndex={0}
                                            aria-label={label}
                                            onMouseEnter={() => setActive(index)}
                                            onFocus={() => setActive(index)}
                                            onBlur={() => setActive(null)}
                                            className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
                                        >
                                            {value > 0 && (
                                                <span
                                                    aria-hidden="true"
                                                    className={`w-full max-w-6 rounded-t-control bg-chartLight transition-[height,filter] duration-300 dark:bg-chartDark ${isActive ? "brightness-110" : ""}`}
                                                    style={{ height: `${(value / top) * 100}%` }}
                                                />
                                            )}
                                            {isActive && (
                                                <MarkTooltip
                                                    value={display(bucket)}
                                                    label={monthName(bucket.month, "long")}
                                                    index={index}
                                                    count={months.length}
                                                    bottom={`${(value / top) * 100}%`}
                                                />
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                        <div className="flex gap-0.5" aria-hidden="true">
                            {months.map((bucket) => (
                                <span key={bucket.month} className="min-w-0 flex-1 truncate text-center text-[0.7rem] text-fontMutedLight dark:text-fontMutedDark">
                                    <span className="sm:hidden">{monthName(bucket.month, "narrow")}</span>
                                    <span className="hidden sm:inline">{monthName(bucket.month, "short")}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

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
