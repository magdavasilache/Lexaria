import { useCallback } from "react";
import { useBooksStore } from "../../../state_management/useBooksStore";
import { useGetFormAuthors } from "../../../api-handling/rtk-hooks/author/useGetFormAuthors";
import { useGetLanguages } from "../../../api-handling/rtk-hooks/language/useGetLanguages";
import SearchableSelect from "../../../forms/components/SearchableSelect";

type Option = { id: number; name: string };

const RATINGS: Option[] = [
    { id: 5, name: "5 ★" },
    { id: 4, name: "4 ★" },
    { id: 3, name: "3 ★" },
    { id: 2, name: "2 ★" },
    { id: 1, name: "1 ★" },
];

export default function BookFilters() {
    const filters = useBooksStore((s) => s.filters);
    const setFilters = useBooksStore((s) => s.setFilters);
    const clearFilters = useBooksStore((s) => s.clearFilters);
    const authors = useGetFormAuthors().data;
    const languages = useGetLanguages().data;

    const hasActiveFilters =
        (filters.genres?.length ?? 0) > 0 ||
        (filters.authors?.length ?? 0) > 0 ||
        (filters.languages?.length ?? 0) > 0 ||
        (filters.ratings?.length ?? 0) > 0;

    const toggleItem = useCallback(
        (field: "genres" | "authors" | "languages" | "ratings", id: number) => {
            const current: number[] = filters[field] ?? [];
            const next = current.includes(id)
                ? current.filter((x) => x !== id)
                : [...current, id];
            setFilters({ [field]: next.length ? next : null });
        },
        [filters, setFilters]
    );

    const removeItem = useCallback(
        (field: "genres" | "authors" | "languages" | "ratings", id: number) => {
            const next = (filters[field] ?? []).filter((x) => x !== id);
            setFilters({ [field]: next.length ? next : null });
        },
        [filters, setFilters]
    );

    const renderBubbles = (
        field: "genres" | "authors" | "languages" | "ratings",
        sourceList: Option[]
    ) => {
        const ids: number[] = filters[field] ?? [];
        if (!ids.length) return null;
        return (
            <div className="flex flex-wrap gap-1.5 mt-2">
                {ids.map((id) => {
                    const label = sourceList.find((o) => o.id === id)?.name ?? id;
                    return (
                        <span
                            key={id}
                            className="
                inline-flex items-center gap-1 px-2.5 py-0.5
                bg-primaryLight/10 dark:bg-primaryDark/15
                border border-primaryLight/30 dark:border-primaryDark/30
                text-primaryLight dark:text-primaryDark
                text-xs rounded-full
                transition-colors
              "
                        >
                            {label}
                            <button
                                onClick={() => removeItem(field, id)}
                                className="
                  ml-0.5 w-3.5 h-3.5 flex items-center justify-center
                  rounded-full opacity-60 hover:opacity-100
                  hover:bg-primaryLight/20 dark:hover:bg-primaryDark/20
                  transition-all
                "
                                aria-label={`Remove ${label}`}
                            >
                                ✕
                            </button>
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className="
        flex flex-col gap-5 p-5
        bg-paperLight dark:bg-paperDark
        border border-dividerLight dark:border-dividerDark
        rounded-sm shadow-cardShadowLight dark:shadow-cardShadowDark
        text-fontPrimaryLight dark:text-fontSecondaryDark
        w-[260px] shrink-0
      "
        >
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-wide uppercase opacity-60">
                    Filters
                </span>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="
              text-xs text-primaryLight dark:text-primaryDark
              hover:underline opacity-80 hover:opacity-100
              transition-opacity
            "
                    >
                        Clear all
                    </button>
                )}
            </div>

            <Divider />

            {/* <FilterSection label="Genre">
                <SearchableSelect
                    options={genres}
                    value={0}
                    placeholder="Add genre…"
                    onChange={(opt) => toggleItem("genres", opt.id)}
                />
                {renderBubbles("genres", genres)}
            </FilterSection> */}

            <Divider />

            <FilterSection label="Author">
                <SearchableSelect
                    options={authors ?? []}
                    value={0}
                    placeholder="Add author…"
                    onChange={(opt) => toggleItem("authors", opt.id)}
                    isForFiltering={true}
                    selectedIds={filters.authors}
                />
                {renderBubbles("authors", (authors ?? []))}
            </FilterSection>

            <Divider />

            <FilterSection label="Language">
                <SearchableSelect
                    options={languages ?? []}
                    value={0}
                    placeholder="Add language…"
                    onChange={(opt) => toggleItem("languages", opt.id)}
                    isForFiltering={true}
                    selectedIds={filters.languages}
                />
                {renderBubbles("languages", (languages ?? []))}
            </FilterSection>

            <Divider />

            <FilterSection label="Rating">
                <div className="flex flex-wrap gap-1.5">
                    {RATINGS.map((r) => {
                        const active = (filters.ratings ?? []).includes(r.id);
                        return (
                            <button
                                key={r.id}
                                onClick={() => toggleItem("ratings", r.id)}
                                className={`
                  px-3 py-1 rounded-full text-xs border transition-all duration-200
                  ${active
                                        ? "bg-primaryLight dark:bg-primaryDark text-white border-primaryLight dark:border-primaryDark"
                                        : "border-dividerLight dark:border-dividerDark hover:border-primaryLight dark:hover:border-primaryDark opacity-70 hover:opacity-100"
                                    }
                `}
                            >
                                {r.name}
                            </button>
                        );
                    })}
                </div>
            </FilterSection>
        </div>
    );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider opacity-50">
                {label}
            </span>
            {children}
        </div>
    );
}

function Divider() {
    return <div className="h-px bg-dividerLight dark:bg-dividerDark opacity-50" />;
}