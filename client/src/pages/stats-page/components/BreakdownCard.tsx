import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import { useStatsFormat } from "../useStatsFormat";
import { CARD_TITLE, HINT, PANEL } from "./styles";

export type BreakdownItem = { id: string | number; label: string; books: number };

type Props = { title: string; icon: LucideIcon; items: BreakdownItem[]; empty: string; hint?: string };

export default function BreakdownCard({ title, icon: Icon, items, empty, hint }: Props) {
    const { t } = useTranslation("front/stats");
    const format = useStatsFormat();
    const titleId = useId();
    const max = Math.max(1, ...items.map((item) => item.books));

    return (
        <section aria-labelledby={titleId} className={`${PANEL} flex min-w-0 flex-col gap-4 p-4 sm:p-5`}>
            <header className="flex items-center gap-2">
                <Icon className="h-5 w-5 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                <h2 id={titleId} className={CARD_TITLE}>{title}</h2>
            </header>
            {items.length === 0 ? (
                <p className={HINT}>{empty}</p>
            ) : (
                <>
                    <ol className="flex flex-col gap-3">
                        {items.map((item) => {
                            const amount = format.amount("books", item.books);
                            return (
                                <li key={item.id} aria-label={t("breakdown.row", { name: item.label, value: amount })} className="flex flex-col gap-1">
                                    <span aria-hidden="true" className="truncate text-sm">{item.label}</span>
                                    <span aria-hidden="true" className="flex items-center gap-2">
                                        <span className="h-2 min-w-0 flex-1">
                                            <span
                                                className="block h-full rounded-r-control bg-chartLight dark:bg-chartDark"
                                                style={{ width: `${(item.books / max) * 100}%` }}
                                            />
                                        </span>
                                        <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums">{format.number(item.books)}</span>
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                    {hint && <p className={HINT}>{hint}</p>}
                </>
            )}
        </section>
    );
}
