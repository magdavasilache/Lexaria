import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, PencilLine, ShieldAlert } from "lucide-react";
import Button from "../../../shared/components/Button";
import { WARNING_SEVERITIES, type ContentWarnings } from "../types/bookTypes";
import type { ReadingStatus } from "../types/UserBookStatusTypes";
import ContentWarningsModal from "./ContentWarningsModal";

const REPORTING_STATUSES: readonly ReadingStatus[] = ["currently_reading", "read", "did_not_finish"];
const SEVERITY_ORDER = [...WARNING_SEVERITIES].reverse();

type Props = {
    bookId: number;
    title: string;
    warnings: ContentWarnings;
    status: ReadingStatus | null;
};

export default function ContentWarningsPanel({ bookId, title, warnings, status }: Props) {
    const { t } = useTranslation("front/books");
    const [shown, setShown] = useState(false);
    const [reporting, setReporting] = useState(false);
    const canReport = status !== null && REPORTING_STATUSES.includes(status);
    const count = warnings.warnings.length;

    return (
        <section
            aria-labelledby="content-warnings-heading"
            className="flex w-full flex-col gap-3 rounded-panel border border-panelBorderLight bg-panelLight p-4 text-fontPrimaryLight shadow-soft-md dark:border-panelBorderDark dark:bg-panelDark dark:text-fontPrimaryDark dark:shadow-deep-md sm:p-5"
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                <h2 id="content-warnings-heading" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
                    <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t("warnings.title")}
                </h2>
                {warnings.reporters > 0 && (
                    <span className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("warnings.reporters", { count: warnings.reporters })}</span>
                )}
            </div>

            {count === 0 ? (
                <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("warnings.empty")}</p>
            ) : (
                <>
                    {!shown && <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("warnings.hiddenHint")}</p>}
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={shown ? EyeOff : Eye}
                        aria-expanded={shown}
                        aria-controls="content-warnings-list"
                        onClick={() => setShown((value) => !value)}
                        className="min-h-10 self-start"
                    >
                        {shown ? t("warnings.hide") : t("warnings.show", { count })}
                    </Button>
                    {shown && (
                        <div id="content-warnings-list" className="flex flex-col gap-3">
                            {SEVERITY_ORDER.map((severity) => {
                                const items = warnings.warnings.filter((item) => item.severity === severity);
                                if (items.length === 0) return null;
                                return (
                                    <div key={severity} className="flex flex-col gap-1.5">
                                        <h3 className="text-sm font-semibold">{t(`warnings.severities.${severity}`)}</h3>
                                        <ul className="flex flex-wrap gap-1.5">
                                            {items.map((item) => (
                                                <li key={item.warning} className="flex items-center gap-1.5 rounded-control bg-panelSelectedLight px-2.5 py-1 text-sm dark:bg-panelSelectedDark">
                                                    <span>{t(`warnings.types.${item.warning}`)}</span>
                                                    <span className="text-xs tabular-nums opacity-80" aria-hidden="true">{item.total}</span>
                                                    <span className="sr-only">{t("warnings.mentions", { count: item.total })}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {canReport ? (
                <Button variant="outline" size="sm" fullWidth leftIcon={warnings.mine.length > 0 ? PencilLine : ShieldAlert} onClick={() => setReporting(true)} className="min-h-10">
                    {t(warnings.mine.length > 0 ? "warnings.editReport" : "warnings.report")}
                </Button>
            ) : (
                <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("warnings.reportHint")}</p>
            )}

            {reporting && <ContentWarningsModal bookId={bookId} title={title} warnings={warnings} onClose={() => setReporting(false)} />}
        </section>
    );
}
