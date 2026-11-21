import { ReactNode, useCallback, useId, useState } from "react";
import { ChevronDown, Languages, LucideIcon, RotateCcw, SlidersHorizontal, Star, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBooksStore } from "../../../state_management/useBooksStore";
import { useGetFormAuthors } from "../../../api-handling/rtk-hooks/author/useGetFormAuthors";
import { useGetLanguages } from "../../../api-handling/rtk-hooks/language/useGetLanguages";
import AutocompleteField from "../../../forms/components/AutocompleteField";
import Button from "../../../global-components/buttons/Button";

type FilterField = "authors" | "languages" | "ratings";

const RATINGS = [5, 4, 3, 2, 1];

export default function BookFilters() {
    const { t } = useTranslation("front/books");
    const panelId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const filters = useBooksStore((s) => s.filters);
    const setFilters = useBooksStore((s) => s.setFilters);
    const clearFilters = useBooksStore((s) => s.clearFilters);
    const authors = useGetFormAuthors().data;
    const languages = useGetLanguages().data;

    const activeCount =
        (filters.genres?.length ?? 0) +
        (filters.authors?.length ?? 0) +
        (filters.languages?.length ?? 0) +
        (filters.ratings?.length ?? 0);

    const setList = useCallback(
        (field: FilterField, ids: number[]) => setFilters({ [field]: ids.length ? ids : null }),
        [setFilters]
    );

    const toggleItem = useCallback(
        (field: FilterField, id: number) => {
            const current: number[] = filters[field] ?? [];
            setList(field, current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
        },
        [filters, setList]
    );

    const countBadge = activeCount > 0 && (
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[0.7rem] font-semibold bg-onPrimaryLight dark:bg-onPrimaryDark text-primaryLight dark:text-primaryDark">
            {activeCount}
        </span>
    );

    return (
        <div
            className="
        relative z-20 w-full lg:w-[272px] lg:shrink-0
        bg-panelLight dark:bg-panelDark
        border border-panelBorderLight dark:border-panelBorderDark
        rounded-panel shadow-soft-md dark:shadow-deep-md
        text-fontPrimaryLight dark:text-fontPrimaryDark font-libre
      "
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
                    <Button
                        variant="inverse"
                        size="sm"
                        leftIcon={RotateCcw}
                        onClick={clearFilters}
                        className="min-h-10 px-2 text-xs"
                    >
                        {t("filters.clearAll")}
                    </Button>
                )}
            </div>

            <div
                id={panelId}
                className={`${isOpen ? "flex animate-slide-down" : "hidden"} lg:flex flex-col gap-5 px-4 pb-5 pt-3 sm:px-5`}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
                    <FilterSection icon={UserRound} label={t("filters.author")}>
                        <AutocompleteField
                            multiple
                            label={t("filters.author")}
                            hideLabel
                            options={authors ?? []}
                            value={filters.authors}
                            placeholder={t("filters.addAuthor")}
                            onChange={(ids) => setList("authors", ids)}
                        />
                    </FilterSection>

                    <FilterSection icon={Languages} label={t("filters.language")}>
                        <AutocompleteField
                            multiple
                            label={t("filters.language")}
                            hideLabel
                            options={languages ?? []}
                            value={filters.languages}
                            placeholder={t("filters.addLanguage")}
                            onChange={(ids) => setList("languages", ids)}
                        />
                    </FilterSection>
                </div>

                <FilterSection icon={Star} label={t("filters.rating")}>
                    <div role="group" aria-label={t("filters.rating")} className="flex w-full sm:max-w-xs lg:max-w-none overflow-hidden rounded-control border border-primaryLight dark:border-primaryDark divide-x divide-primaryLight/40 dark:divide-primaryDark/40">
                        {RATINGS.map((rating) => {
                            const active = (filters.ratings ?? []).includes(rating);
                            return (
                                <Button
                                    key={rating}
                                    variant="segment"
                                    size="sm"
                                    rightIcon={Star}
                                    iconClassName={active ? "fill-current" : ""}
                                    aria-pressed={active}
                                    aria-label={t("filters.stars", { count: rating })}
                                    onClick={() => toggleItem("ratings", rating)}
                                    className="min-h-10"
                                >
                                    {rating}
                                </Button>
                            );
                        })}
                    </div>
                </FilterSection>
            </div>
        </div>
    );
}

function FilterSection({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-2 min-w-0">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {label}
            </h3>
            {children}
        </section>
    );
}
