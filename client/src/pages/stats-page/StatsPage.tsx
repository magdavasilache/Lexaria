import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookCopy, Tags } from "lucide-react";
import SelectField from "../../forms/components/SelectField";
import { useStats } from "../../api-handling/rtk-hooks/stats/useStats";
import { PAGE_CONTAINER } from "../../utils/layout";
import { useDocumentTitle } from "../../utils/useDocumentTitle";
import BreakdownCard from "./components/BreakdownCard";
import ChallengeCard from "./components/ChallengeCard";
import EmptyYear from "./components/EmptyYear";
import MonthlyChart from "./components/MonthlyChart";
import StreakCard from "./components/StreakCard";
import TotalsRow from "./components/TotalsRow";

const SKELETON = "animate-pulse rounded-panel bg-skeletonLight dark:bg-skeletonDark";

export default function StatsPage() {
    const { t } = useTranslation(["front/stats", "front/common", "front/reading"]);
    useDocumentTitle(t("front/common:pageTitle.stats"));
    const [year, setYear] = useState<number | null>(null);
    const { data: stats, isFetching, isError, isPlaceholderData } = useStats(year);
    const hasActivity = stats ? stats.totals.books > 0 || stats.totals.sessions > 0 : false;

    return (
        <main className={`${PAGE_CONTAINER} flex flex-col gap-4 py-4 sm:gap-5 sm:py-6`} aria-busy={isFetching || undefined}>
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                    <h1 className="font-libre text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
                    {stats && <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("subtitle", { year: stats.year })}</p>}
                </div>
                {stats && (
                    <SelectField
                        label={t("yearLabel")}
                        tone="panel"
                        options={stats.available_years.map((option) => ({ value: option, label: String(option) }))}
                        value={year ?? stats.year}
                        onChange={setYear}
                        className="w-full sm:w-40"
                    />
                )}
            </header>

            {stats ? (
                <div className={`flex flex-col gap-4 transition-opacity duration-200 sm:gap-5 ${isPlaceholderData ? "opacity-60" : ""}`}>
                    {hasActivity ? (
                        <TotalsRow year={stats.year} totals={stats.totals} allTimeBooks={stats.all_time_books} />
                    ) : (
                        <EmptyYear year={stats.year} />
                    )}
                    <div className="grid grid-flow-row-dense grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <ChallengeCard year={stats.year} progress={stats.challenge} />
                        <StreakCard streak={stats.streak} today={stats.today} />
                        {hasActivity && (
                            <>
                                <BreakdownCard
                                    title={t("genres.title")}
                                    icon={Tags}
                                    items={stats.genres.map((genre) => ({ id: genre.genre_id, label: genre.name, books: genre.books }))}
                                    empty={t("genres.empty", { year: stats.year })}
                                    hint={t("genres.hint")}
                                />
                                <MonthlyChart year={stats.year} months={stats.months} className="md:col-span-2" />
                                <BreakdownCard
                                    title={t("formats.title")}
                                    icon={BookCopy}
                                    items={stats.formats.map((slice) => ({
                                        id: slice.format ?? "none",
                                        label: slice.format ? t(`front/reading:formats.${slice.format}`) : t("formats.unknown"),
                                        books: slice.books,
                                    }))}
                                    empty={t("formats.empty", { year: stats.year })}
                                />
                            </>
                        )}
                    </div>
                </div>
            ) : !isError && (
                <div role="status" className="flex flex-col gap-4">
                    <span className="sr-only">{t("loading")}</span>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-hidden="true">
                        {Array.from({ length: 5 }, (_, index) => (
                            <div key={index} className={`${SKELETON} h-24 ${index === 4 ? "col-span-2 sm:col-span-1" : ""}`} />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
                        <div className={`${SKELETON} h-48`} />
                        <div className={`${SKELETON} h-48`} />
                    </div>
                </div>
            )}
        </main>
    );
}
