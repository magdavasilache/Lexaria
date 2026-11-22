import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flame } from "lucide-react";
import type { Streak } from "../statsTypes";
import { useStatsFormat } from "../hooks/useStatsFormat";
import MarkTooltip from "../../../shared/components/charts/MarkTooltip";
import { CARD_TITLE, FIGURE, HINT, LABEL, PANEL } from "./styles";

export default function StreakCard({ streak, today }: { streak: Streak; today: string }) {
    const { t } = useTranslation("front/stats");
    const format = useStatsFormat();
    const [active, setActive] = useState<number | null>(null);
    const readToday = streak.last_days.some((day) => day.day === today && day.minutes > 0);
    const hint = readToday ? t("streak.kept") : streak.current > 0 ? t("streak.keep") : t("streak.start");

    return (
        <section aria-labelledby="stats-streak" className={`${PANEL} flex flex-col gap-4 p-4 sm:p-5`}>
            <header className="flex items-center gap-2">
                <Flame className="h-5 w-5 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                <h2 id="stats-streak" className={CARD_TITLE}>{t("streak.title")}</h2>
            </header>

            <dl className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <dt className={LABEL}>{t("streak.current")}</dt>
                    <dd className={FIGURE}>{t("streak.days", { count: streak.current })}</dd>
                </div>
                <div className="flex flex-col gap-1">
                    <dt className={LABEL}>{t("streak.longest")}</dt>
                    <dd className={FIGURE}>{t("streak.days", { count: streak.longest })}</dd>
                </div>
            </dl>

            <div className="flex flex-col gap-2">
                <h3 className={LABEL}>{t("streak.lastDays")}</h3>
                <ol className="grid grid-cols-7 gap-1 sm:gap-2" onMouseLeave={() => setActive(null)}>
                    {streak.last_days.map((day, index) => {
                        const isToday = day.day === today;
                        const read = day.minutes > 0;
                        const name = format.longDay(day.day);
                        const amount = read ? format.duration(day.minutes * 60) : t("streak.noReading");
                        return (
                            <li
                                key={day.day}
                                tabIndex={0}
                                aria-label={t("streak.day", { day: name, value: amount })}
                                aria-current={isToday ? "date" : undefined}
                                onMouseEnter={() => setActive(index)}
                                onFocus={() => setActive(index)}
                                onBlur={() => setActive(null)}
                                className="relative flex min-w-0 flex-col items-center gap-1 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`h-8 w-full rounded-control transition-[filter] ${read ? "bg-primaryLight dark:bg-primaryDark" : "bg-primaryLight/15 dark:bg-primaryDark/20"} ${active === index ? "brightness-110" : ""}`}
                                />
                                <span aria-hidden="true" className={`truncate text-[0.7rem] ${isToday ? "font-semibold text-fontPrimaryLight dark:text-fontPrimaryDark" : "text-fontMutedLight dark:text-fontMutedDark"}`}>
                                    {isToday ? t("streak.today") : format.weekday(day.day)}
                                </span>
                                {active === index && <MarkTooltip value={amount} label={name} index={index} count={streak.last_days.length} />}
                            </li>
                        );
                    })}
                </ol>
            </div>

            <p className={HINT}>{hint}</p>
        </section>
    );
}
