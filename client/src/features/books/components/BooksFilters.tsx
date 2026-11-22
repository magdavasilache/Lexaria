import { ArrowUpDown, BookOpenText, Gauge, Languages, Search, ShieldAlert, Smile, Star, Tags, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { countActiveFilters, useBooksStore } from "../stores/useBooksStore";
import { authorOptions, useAuthors, useGenres, useLanguages } from "../../catalog/hooks/useCatalog";
import AutocompleteField from "../../../shared/forms/fields/AutocompleteField";
import SelectField from "../../../shared/forms/fields/SelectField";
import FormField from "../../../shared/forms/fields/FormField";
import NumberField from "../../../shared/forms/fields/NumberField";
import { MoodChips, PaceSegments } from "./SignalPickers";
import { pagesRangeInvalid } from "../hooks/useBooks";
import Button from "../../../shared/components/Button";
import FiltersPanel, { FilterSection } from "../../../shared/components/FiltersPanel";
import { BOOK_SORTS, CONTENT_WARNINGS } from "../types/bookTypes";
import { BOOK_RULES } from "../schemas/bookRules";

const RATINGS = Array.from({ length: BOOK_RULES.ratingMax }, (_, index) => index + 1);

export default function BookFilters() {
    const { t } = useTranslation("front/books");
    const filters = useBooksStore((s) => s.filters);
    const setFilters = useBooksStore((s) => s.setFilters);
    const clearFilters = useBooksStore((s) => s.clearFilters);
    const authors = authorOptions(useAuthors().data);
    const languages = useLanguages().data;
    const genres = useGenres().data;

    const activeCount = countActiveFilters(filters);
    const warningOptions = CONTENT_WARNINGS.map((warning, index) => ({ id: index + 1, name: t(`warnings.types.${warning}`) }));
    const rangeError = pagesRangeInvalid(filters) ? { message: "front/books:filters.pagesRangeInvalid" } : undefined;

    return (
        <FiltersPanel
            activeCount={activeCount}
            onClear={clearFilters}
            className="lg:w-64 xl:w-72 lg:shrink-0"
            bodyClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6 gap-y-5"
        >
                <FilterSection icon={Search} label={t("filters.search")} wide>
                    <FormField
                        label={t("filters.search")}
                        hideLabel
                        type="search"
                        leftIcon={Search}
                        maxLength={BOOK_RULES.titleMaxLength}
                        placeholder={t("filters.searchPlaceholder")}
                        value={filters.q}
                        onChange={(event) => setFilters({ q: event.target.value })}
                    />
                </FilterSection>

                <FilterSection icon={UserRound} label={t("filters.author")}>
                    <AutocompleteField
                        multiple
                        label={t("filters.author")}
                        hideLabel
                        options={authors}
                        value={filters.author_ids}
                        placeholder={t("filters.addAuthor")}
                        onChange={(ids) => setFilters({ author_ids: ids })}
                    />
                </FilterSection>

                <FilterSection icon={Tags} label={t("filters.genre")}>
                    <AutocompleteField
                        multiple
                        label={t("filters.genre")}
                        hideLabel
                        options={genres ?? []}
                        value={filters.genre_ids}
                        placeholder={t("filters.addGenre")}
                        onChange={(ids) => setFilters({ genre_ids: ids })}
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

            <FilterSection icon={Smile} label={t("filters.mood")}>
                <MoodChips label={t("filters.mood")} value={filters.moods} onChange={(moods) => setFilters({ moods })} />
            </FilterSection>

            <FilterSection icon={Gauge} label={t("filters.pace")}>
                <PaceSegments label={t("filters.pace")} value={filters.paces} onChange={(paces) => setFilters({ paces })} />
            </FilterSection>

            <FilterSection icon={ShieldAlert} label={t("filters.avoid")}>
                <AutocompleteField
                    multiple
                    label={t("filters.avoid")}
                    hideLabel
                    options={warningOptions}
                    value={filters.avoid_warnings.map((warning) => CONTENT_WARNINGS.indexOf(warning) + 1)}
                    placeholder={t("filters.addAvoid")}
                    onChange={(ids) => setFilters({ avoid_warnings: ids.map((id) => CONTENT_WARNINGS[id - 1]) })}
                />
            </FilterSection>

            <FilterSection icon={BookOpenText} label={t("filters.pages")}>
                <div className="grid grid-cols-2 gap-2">
                    <NumberField
                        label={t("filters.minPages")}
                        min={1}
                        max={BOOK_RULES.pagesMax}
                        showStepper={false}
                        value={filters.min_pages}
                        onChange={(value) => setFilters({ min_pages: value })}
                    />
                    <NumberField
                        label={t("filters.maxPages")}
                        min={1}
                        max={BOOK_RULES.pagesMax}
                        showStepper={false}
                        error={rangeError}
                        value={filters.max_pages}
                        onChange={(value) => setFilters({ max_pages: value })}
                    />
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
