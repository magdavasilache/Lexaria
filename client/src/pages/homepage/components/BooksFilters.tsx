import { ArrowUpDown, Languages, Star, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBooksStore } from "../../../state_management/useBooksStore";
import { useGetFormAuthors } from "../../../api-handling/rtk-hooks/author/useGetFormAuthors";
import { useGetLanguages } from "../../../api-handling/rtk-hooks/language/useGetLanguages";
import AutocompleteField from "../../../forms/components/AutocompleteField";
import SelectField from "../../../forms/components/SelectField";
import Button from "../../../global-components/buttons/Button";
import FiltersPanel, { FilterSection } from "../../../global-components/filters/FiltersPanel";
import { BOOK_SORTS } from "../../../types/book-types/bookTypes";
import { BOOK_RULES } from "../../../schemas/bookRules";

const RATINGS = Array.from({ length: BOOK_RULES.ratingMax }, (_, index) => index + 1);

export default function BookFilters() {
    const { t } = useTranslation("front/books");
    const filters = useBooksStore((s) => s.filters);
    const setFilters = useBooksStore((s) => s.setFilters);
    const clearFilters = useBooksStore((s) => s.clearFilters);
    const authors = useGetFormAuthors().data;
    const languages = useGetLanguages().data;

    const activeCount =
        filters.genre_ids.length +
        filters.author_ids.length +
        filters.language_ids.length +
        (filters.min_rating === null ? 0 : 1);

    return (
        <FiltersPanel
            activeCount={activeCount}
            onClear={clearFilters}
            className="lg:w-64 xl:w-72 lg:shrink-0"
            bodyClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6 gap-y-5"
        >
                <FilterSection icon={UserRound} label={t("filters.author")}>
                    <AutocompleteField
                        multiple
                        label={t("filters.author")}
                        hideLabel
                        options={authors ?? []}
                        value={filters.author_ids}
                        placeholder={t("filters.addAuthor")}
                        onChange={(ids) => setFilters({ author_ids: ids })}
                    />
                </FilterSection>

                <FilterSection icon={Languages} label={t("filters.language")}>
                    <AutocompleteField
                        multiple
                        label={t("filters.language")}
                        hideLabel
                        options={languages ?? []}
                        value={filters.language_ids}
                        placeholder={t("filters.addLanguage")}
                        onChange={(ids) => setFilters({ language_ids: ids })}
                    />
                </FilterSection>

            <FilterSection icon={Star} label={t("filters.rating")}>
                <div role="group" aria-label={t("filters.rating")} className="flex w-full sm:max-w-xs lg:max-w-none overflow-hidden rounded-control border border-primaryLight dark:border-primaryDark divide-x divide-primaryLight/40 dark:divide-primaryDark/40">
                    {RATINGS.map((rating) => {
                        const active = filters.min_rating === rating;
                        return (
                            <Button
                                key={rating}
                                variant="segment"
                                size="sm"
                                rightIcon={Star}
                                iconClassName={active ? "fill-current" : ""}
                                aria-pressed={active}
                                aria-label={t("filters.atLeastStars", { count: rating })}
                                onClick={() => setFilters({ min_rating: active ? null : rating })}
                                className="min-h-10"
                            >
                                {rating}+
                            </Button>
                        );
                    })}
                </div>
            </FilterSection>

            <FilterSection icon={ArrowUpDown} label={t("filters.sort")}>
                <SelectField
                    label={t("filters.sort")}
                    hideLabel
                    value={filters.sort}
                    options={BOOK_SORTS.map((sort) => ({ value: sort, label: t(`filters.sortOptions.${sort}`) }))}
                    onChange={(sort) => setFilters({ sort })}
                />
            </FilterSection>
        </FiltersPanel>
    );
}
