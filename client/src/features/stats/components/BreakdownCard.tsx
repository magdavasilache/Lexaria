import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import BarList from "../../../shared/components/charts/BarList";
import { useStatsFormat } from "../hooks/useStatsFormat";
import { CARD_TITLE, HINT, PANEL } from "./styles";

export type BreakdownItem = { id: string | number; label: string; books: number };

type Props = { title: string; icon: LucideIcon; items: BreakdownItem[]; empty: string; hint?: string };

export default function BreakdownCard({ title, icon: Icon, items, empty, hint }: Props) {
    const { t } = useTranslation("front/stats");
    const format = useStatsFormat();
    const titleId = useId();

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
                    <BarList
                        items={items.map((item) => ({
                            id: item.id,
                            label: item.label,
                            value: item.books,
                            valueText: format.number(item.books),
                            ariaLabel: t("breakdown.row", { name: item.label, value: format.amount("books", item.books) }),
                        }))}
                    />
                    {hint && <p className={HINT}>{hint}</p>}
                </>
            )}
        </section>
    );
}
