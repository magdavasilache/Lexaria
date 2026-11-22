import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartColumn, RotateCcw, Shapes } from "lucide-react";
import Button from "../../../shared/components/Button";
import BarList from "../../../shared/components/charts/BarList";
import ColumnChart from "../../../shared/components/charts/ColumnChart";
import { parseDay } from "../../stats/hooks/useStatsFormat";
import type { AnalyticsWeek, ChatbotAnalytics } from "../chatbotTypes";
import { useChatbotAnalytics } from "../hooks/useChatbot";

const RANGES = [12, 26, 52] as const;
const METRICS = ["fallbackRate", "unknowns", "messages", "helpful"] as const;
type Metric = (typeof METRICS)[number];
const AXIS_LABELS = 6;
const INTENTS_SHOWN = 10;
const SKELETON_TILES = 4;

const PANEL = "rounded-panel border border-panelBorderLight bg-panelLight shadow-soft-sm dark:border-panelBorderDark dark:bg-panelDark dark:shadow-deep-sm";
const SEGMENTS = "flex w-full overflow-hidden rounded-control border border-primaryLight divide-x divide-primaryLight/40 dark:border-primaryDark dark:divide-primaryDark/40 sm:w-auto";
const TITLE = "font-libre text-base font-semibold sm:text-lg";

const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : null);

const weekRatio = (week: AnalyticsWeek, metric: Metric) =>
    metric === "fallbackRate" ? ratio(week.fallbacks, week.messages) : metric === "helpful" ? ratio(week.thumbs_up, week.thumbs_up + week.thumbs_down) : null;

const sum = (weeks: AnalyticsWeek[], pick: (week: AnalyticsWeek) => number) => weeks.reduce((total, week) => total + pick(week), 0);

function useFormats() {
    const { i18n } = useTranslation();
    const language = i18n.resolvedLanguage;
    return {
        number: (value: number) => new Intl.NumberFormat(language).format(value),
        percent: (value: number) => new Intl.NumberFormat(language, { style: "percent", maximumFractionDigits: 0 }).format(value),
        week: (day: string) => new Intl.DateTimeFormat(language, { day: "numeric", month: "short" }).format(parseDay(day)),
        longWeek: (day: string) => new Intl.DateTimeFormat(language, { day: "numeric", month: "long", year: "numeric" }).format(parseDay(day)),
    };
}

function Totals({ data }: { data: ChatbotAnalytics }) {
    const { t } = useTranslation("front/admin");
    const format = useFormats();
    const messages = sum(data.weeks, (week) => week.messages);
    const fallbacks = sum(data.weeks, (week) => week.fallbacks);
    const up = sum(data.weeks, (week) => week.thumbs_up);
    const down = sum(data.weeks, (week) => week.thumbs_down);
    const fallbackRate = ratio(fallbacks, messages);
    const helpful = ratio(up, up + down);

    const tiles = [
        { id: "messages", value: format.number(messages), hint: t("chatbot.analytics.totals.messagesHint") },
        { id: "fallbackRate", value: fallbackRate === null ? "—" : format.percent(fallbackRate), hint: t("chatbot.analytics.totals.fallbackHint", { count: fallbacks, value: format.number(fallbacks) }) },
        { id: "unknowns", value: format.number(sum(data.weeks, (week) => week.unknowns)), hint: t("chatbot.analytics.totals.unknownsHint") },
        { id: "helpful", value: helpful === null ? "—" : format.percent(helpful), hint: t("chatbot.analytics.totals.helpfulHint", { up: format.number(up), down: format.number(down) }) },
    ] as const;

    return (
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((tile) => (
                <div key={tile.id} className={`${PANEL} flex min-w-0 flex-col gap-1 p-3 sm:p-4`}>
                    <dt className="text-xs font-medium text-fontMutedLight dark:text-fontMutedDark">{t(`chatbot.analytics.metrics.${tile.id}`)}</dt>
                    <dd className="break-words text-xl font-semibold leading-tight sm:text-2xl">{tile.value}</dd>
                    <dd className="text-xs text-fontMutedLight dark:text-fontMutedDark">{tile.hint}</dd>
                </div>
            ))}
        </dl>
    );
}

function WeeklyChart({ weeks }: { weeks: AnalyticsWeek[] }) {
    const { t } = useTranslation("front/admin");
    const format = useFormats();
    const titleId = useId();
    const [metric, setMetric] = useState<Metric>("fallbackRate");
    const isRatio = metric === "fallbackRate" || metric === "helpful";
    const every = Math.ceil(weeks.length / AXIS_LABELS);

    const point = (week: AnalyticsWeek) => {
        if (metric === "messages" || metric === "unknowns") {
            const value = week[metric];
            return { value, text: t(`chatbot.analytics.units.${metric}`, { count: value, value: format.number(value) }) };
        }
        const value = weekRatio(week, metric);
        return { value: value === null ? 0 : value * 100, text: value === null ? t(`chatbot.analytics.noData.${metric}`) : format.percent(value) };
    };

    return (
        <section aria-labelledby={titleId} className={`${PANEL} flex min-w-0 flex-col gap-3 p-3 sm:p-4 xl:col-span-2`}>
            <header className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <ChartColumn className="h-5 w-5 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                    <h3 id={titleId} className={TITLE}>{t("chatbot.analytics.weekly")}</h3>
                </div>
                <div role="group" aria-label={t("chatbot.analytics.metricsLabel")} className={`${SEGMENTS} flex-wrap sm:flex-nowrap`}>
                    {METRICS.map((option) => (
                        <Button key={option} variant="segment" size="sm" aria-pressed={metric === option} onClick={() => setMetric(option)} className="min-h-10 sm:px-3">
                            {t(`chatbot.analytics.metrics.${option}`)}
                        </Button>
                    ))}
                </div>
            </header>
            <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t(`chatbot.analytics.captions.${metric}`)}</p>
            <ColumnChart
                labelledBy={titleId}
                formatTick={(tick) => (isRatio ? format.percent(tick / 100) : format.number(tick))}
                empty={t(`chatbot.analytics.empty.${metric}`)}
                data={weeks.map((week, index) => {
                    const { value, text } = point(week);
                    const label = t("chatbot.analytics.weekOf", { date: format.longWeek(week.week_start) });
                    return {
                        key: week.week_start,
                        value,
                        valueText: text,
                        label,
                        axisLabel: index % every === 0 ? format.week(week.week_start) : "",
                        ariaLabel: t("chatbot.analytics.bar", { week: label, value: text }),
                    };
                })}
            />
        </section>
    );
}

function IntentMix({ intents }: { intents: ChatbotAnalytics["intents"] }) {
    const { t } = useTranslation("front/admin");
    const format = useFormats();
    const titleId = useId();
    const shown = intents.slice(0, INTENTS_SHOWN);
    const rest = intents.slice(INTENTS_SHOWN).reduce((total, item) => total + item.count, 0);
    const items = rest > 0 ? [...shown, { tag: t("chatbot.analytics.otherIntents"), count: rest }] : shown;

    return (
        <section aria-labelledby={titleId} className={`${PANEL} flex min-w-0 flex-col gap-3 p-3 sm:p-4`}>
            <header className="flex items-center gap-2">
                <Shapes className="h-5 w-5 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                <h3 id={titleId} className={TITLE}>{t("chatbot.analytics.intents")}</h3>
            </header>
            {items.length === 0 ? (
                <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("chatbot.analytics.intentsEmpty")}</p>
            ) : (
                <BarList
                    items={items.map((item) => ({
                        id: item.tag,
                        label: item.tag,
                        value: item.count,
                        valueText: format.number(item.count),
                        ariaLabel: t("chatbot.analytics.intentRow", { tag: item.tag, count: item.count, value: format.number(item.count) }),
                    }))}
                />
            )}
        </section>
    );
}

export default function AnalyticsSection() {
    const { t } = useTranslation("front/admin");
    const [weeks, setWeeks] = useState<(typeof RANGES)[number]>(RANGES[0]);
    const analytics = useChatbotAnalytics(weeks);

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
            <div role="group" aria-label={t("chatbot.analytics.rangeLabel")} className={`${SEGMENTS} shrink-0 sm:self-start`}>
                {RANGES.map((range) => (
                    <Button key={range} variant="segment" size="sm" aria-pressed={weeks === range} onClick={() => setWeeks(range)} className="min-h-10 sm:px-4">
                        {t("chatbot.analytics.range", { count: range })}
                    </Button>
                ))}
            </div>

            {analytics.data ? (
                <>
                    <Totals data={analytics.data} />
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                        <WeeklyChart weeks={analytics.data.weeks} />
                        <IntentMix intents={analytics.data.intents} />
                    </div>
                </>
            ) : analytics.isError ? (
                <div role="alert" className={`${PANEL} flex flex-col items-start gap-3 p-3 sm:flex-row sm:items-center sm:p-4`}>
                    <p className="flex-1 text-sm">{t("chatbot.analytics.error")}</p>
                    <Button variant="outline" size="sm" leftIcon={RotateCcw} onClick={() => analytics.refetch()} className="min-h-10">
                        {t("chatbot.analytics.retry")}
                    </Button>
                </div>
            ) : (
                <div role="status" aria-label={t("chatbot.analytics.loading")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {Array.from({ length: SKELETON_TILES }, (_, index) => (
                        <span key={index} className="h-24 animate-pulse rounded-panel bg-skeletonLight dark:bg-skeletonDark" />
                    ))}
                </div>
            )}
        </div>
    );
}
