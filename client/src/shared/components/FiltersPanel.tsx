import { ReactNode, createContext, useContext, useId, useState } from "react";
import { ChevronDown, LucideIcon, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "./Button";

const CompactContext = createContext(false);

type Props = {
    activeCount: number;
    compact?: boolean;
    onClear: () => void;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
};

export default function FiltersPanel({ activeCount, compact = false, onClear, children, className = "", bodyClassName = "flex flex-col gap-5" }: Props) {
    const { t } = useTranslation("front/common");
    const panelId = useId();
    const [isOpen, setIsOpen] = useState(false);

    const countBadge = activeCount > 0 && (
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[0.7rem] font-semibold bg-onPrimaryLight dark:bg-onPrimaryDark text-primaryLight dark:text-primaryDark">
            {activeCount}
        </span>
    );

    const compactBadge = activeCount > 0 && (
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[0.7rem] font-semibold bg-primaryLight dark:bg-primaryDark text-onPrimaryLight dark:text-onPrimaryDark">
            {activeCount}
        </span>
    );

    const surface = "relative z-20 w-full bg-tableFooterLight dark:bg-tableFooterDark border border-tableBorderLight dark:border-tableBorderDark rounded-panel text-fontPrimaryLight dark:text-fontPrimaryDark font-libre";

    if (compact) {
        return (
            <div role="group" aria-label={t("filters.title")} className={`${surface} flex flex-col gap-3 px-3 py-2.5 shadow-soft-sm dark:shadow-deep-sm lg:flex-row lg:items-center lg:gap-4 lg:px-4 ${className}`}>
                <div className="flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={SlidersHorizontal}
                        rightIcon={ChevronDown}
                        iconClassName={`last:transition-transform last:duration-200 ${isOpen ? "last:rotate-180" : ""}`}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setIsOpen((prev) => !prev)}
                        className="min-h-10 lg:hidden"
                    >
                        <span className="flex items-center gap-2">
                            {t("filters.title")}
                            {compactBadge}
                        </span>
                    </Button>
                    <span className="hidden lg:flex shrink-0 items-center gap-2 pr-4 border-r border-tableBorderLight dark:border-tableBorderDark text-sm font-semibold whitespace-nowrap text-tableHeaderTextLight dark:text-tableHeaderTextDark">
                        <SlidersHorizontal className="w-4 h-4" aria-label={t("filters.title")} />
                        <span className="hidden xl:inline">{t("filters.title")}</span>
                        {compactBadge}
                    </span>
                </div>
                <div id={panelId} className={`${isOpen ? "flex animate-slide-down" : "hidden"} lg:flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center`}>
                    <CompactContext.Provider value={true}>{children}</CompactContext.Provider>
                </div>
                <Button variant="outline" size="sm" leftIcon={RotateCcw} onClick={onClear} disabled={activeCount === 0} className="min-h-10 shrink-0 self-end lg:ml-auto lg:self-auto">
                    {t("filters.reset")}
                </Button>
            </div>
        );
    }

    return (
        <div
            className={`relative z-20 w-full bg-panelLight dark:bg-panelDark border border-panelBorderLight dark:border-panelBorderDark rounded-panel shadow-soft-md dark:shadow-deep-md text-fontPrimaryLight dark:text-fontPrimaryDark font-libre ${className}`}
        >
            <div className="flex items-center justify-between gap-2 px-2 py-1 lg:px-4 lg:py-1.5 min-h-12 rounded-t-panel bg-primaryLight dark:bg-primaryDark text-onPrimaryLight dark:text-onPrimaryDark">
                <Button
                    variant="inverse"
                    leftIcon={SlidersHorizontal}
                    rightIcon={ChevronDown}
                    iconClassName={`last:transition-transform last:duration-200 ${isOpen ? "last:rotate-180" : ""}`}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="lg:hidden min-h-10 font-semibold"
                >
                    <span className="flex items-center gap-2">
                        {t("filters.title")}
                        {countBadge}
                    </span>
                </Button>

                <h2 className="hidden lg:flex items-center gap-2 text-base font-semibold">
                    <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
                    {t("filters.title")}
                    {countBadge}
                </h2>

                {activeCount > 0 && (
                    <Button variant="inverse" size="sm" leftIcon={RotateCcw} onClick={onClear} className="min-h-10 px-2 text-xs">
                        {t("filters.clearAll")}
                    </Button>
                )}
            </div>

            <div id={panelId} className={`${isOpen ? "block animate-slide-down" : "hidden"} lg:block px-4 pb-5 pt-3 sm:px-5`}>
                <div className={bodyClassName}>{children}</div>
            </div>
        </div>
    );
}

export function FilterSection({ icon: Icon, label, wide = false, children }: { icon: LucideIcon; label: string; wide?: boolean; children: ReactNode }) {
    const compact = useContext(CompactContext);
    if (compact) return <div className={`min-w-0 lg:flex-1 lg:basis-0 ${wide ? "lg:max-w-56 lg:grow-[1.3]" : "lg:max-w-44"}`}>{children}</div>;
    return (
        <section className={`flex flex-col gap-2.5 min-w-0 ${wide ? "sm:col-span-full" : ""} lg:border-t lg:border-panelBorderLight lg:dark:border-panelBorderDark lg:pt-5 lg:first:border-t-0 lg:first:pt-0`}>
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-control bg-panelSelectedLight dark:bg-panelSelectedDark text-primaryLight dark:text-primaryDark">
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                {label}
            </h3>
            {children}
        </section>
    );
}
