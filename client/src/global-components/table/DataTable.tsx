import { ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, LucideIcon, Pencil, RotateCcw, Search, Trash2 } from "lucide-react";
import Button from "../buttons/Button";
import FiltersPanel, { FilterSection } from "../filters/FiltersPanel";
import FormField from "../../forms/components/FormField";
import SelectField, { SelectOption } from "../../forms/components/SelectField";
import AutocompleteField, { AutocompleteOption } from "../../forms/components/AutocompleteField";
import DateField from "../../forms/components/DateField";
import { FilterValue, PAGE_SIZE_OPTIONS, useDataTableState } from "./useDataTableState";

export interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => ReactNode;
    width?: string;
    align?: "left" | "right";
    className?: string;
}

export type TableFilter<T> =
    | {
        kind: "multi";
        key: string;
        label: string;
        icon: LucideIcon;
        placeholder?: string;
        options: AutocompleteOption[];
        matches?: (row: T, ids: number[]) => boolean;
    }
    | {
        kind: "select";
        key: string;
        label: string;
        icon: LucideIcon;
        options: SelectOption<string>[];
        matches?: (row: T, value: string) => boolean;
    }
    | {
        kind: "date";
        key: string;
        label: string;
        icon: LucideIcon;
        min?: string;
        max?: string;
        matches?: (row: T, value: string) => boolean;
    };

const PAGE_WINDOW = 2;
const SKELETON_ROWS = 5;

interface Props<T extends { id: number }> {
    stateKey: string;
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    isFetching?: boolean;
    isError?: boolean;
    onRetry?: () => void;
    remoteTotal?: number;
    searchKeys?: (keyof T)[];
    filters?: TableFilter<T>[];
    rowLabel?: (row: T) => string;
    rowActions?: (row: T) => ReactNode;
    onView?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    defaultPageSize?: number;
    emptyMessage?: string;
}

const isActive = (value: FilterValue | undefined) => (Array.isArray(value) ? value.length > 0 : Boolean(value));

const cellValue = <T,>(row: T, column: Column<T>): ReactNode =>
    column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "—");

const ICON_BUTTON = "min-h-10 min-w-10 justify-center";

export default function DataTable<T extends { id: number }>({
    stateKey,
    data,
    columns,
    isLoading,
    isFetching,
    isError,
    onRetry,
    remoteTotal,
    searchKeys = [],
    filters = [],
    rowLabel = (row) => String(row.id),
    rowActions,
    onView,
    onEdit,
    onDelete,
    defaultPageSize = PAGE_SIZE_OPTIONS[0],
    emptyMessage,
}: Props<T>) {
    const { t } = useTranslation("front/common");
    const { state, setState } = useDataTableState(stateKey, defaultPageSize);
    const isRemote = remoteTotal !== undefined;
    const { search, page, pageSize, values } = state;

    const setPage = (value: number) => setState({ page: value });
    const setValue = (key: string, value: FilterValue) => setState({ values: { ...values, [key]: value }, page: 1 });
    const clearAll = () => setState({ search: "", values: {}, page: 1 });

    const filtered = useMemo(() => {
        if (isRemote) return data;
        const query = search.trim().toLowerCase();
        return data.filter((row) => {
            if (query && searchKeys.length && !searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(query))) return false;
            return filters.every((filter) => {
                const value = values[filter.key];
                if (!isActive(value) || !filter.matches) return true;
                return filter.kind === "multi" ? filter.matches(row, value as number[]) : filter.matches(row, value as string);
            });
        });
    }, [isRemote, data, search, searchKeys, filters, values]);

    const total = remoteTotal ?? filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const paginated = isRemote ? data : filtered.slice(start, start + pageSize);
    const firstPage = Math.max(1, safePage - PAGE_WINDOW);
    const pageWindow = Array.from({ length: Math.min(totalPages, safePage + PAGE_WINDOW) - firstPage + 1 }, (_, i) => firstPage + i);

    const hasSearch = searchKeys.length > 0;
    const hasFilters = hasSearch || filters.length > 0;
    const activeCount = (search.trim() ? 1 : 0) + filters.filter((filter) => isActive(values[filter.key])).length;
    const hasActions = Boolean(rowActions || onView || onEdit || onDelete);
    const colSpan = columns.length + (hasActions ? 1 : 0);

    const actions = (row: T) => {
        const label = rowLabel(row);
        return (
            <div className="flex items-center justify-end gap-0.5">
                {rowActions?.(row)}
                {onView && <Button variant="ghost" size="sm" icon={Eye} aria-label={t("table.view", { label })} onClick={() => onView(row)} className={ICON_BUTTON} />}
                {onEdit && <Button variant="ghost" size="sm" icon={Pencil} aria-label={t("table.edit", { label })} onClick={() => onEdit(row)} className={ICON_BUTTON} />}
                {onDelete && <Button variant="menuDanger" size="sm" icon={Trash2} aria-label={t("table.delete", { label })} onClick={() => onDelete(row)} className={ICON_BUTTON} />}
            </div>
        );
    };

    const emptyState = <p className="px-4 py-8 text-center text-sm text-fontMutedLight dark:text-fontMutedDark">{emptyMessage ?? t("table.empty")}</p>;
    const headCell = "sticky top-0 z-10 bg-tableHeaderLight dark:bg-tableHeaderDark px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-tableHeaderTextLight dark:text-tableHeaderTextDark border-b border-tableBorderLight dark:border-tableBorderDark";

    return (
        <div className="flex h-full min-h-0 min-w-0 flex-col gap-3 text-fontPrimaryLight dark:text-fontPrimaryDark">
            {hasFilters && (
                <FiltersPanel compact activeCount={activeCount} onClear={clearAll} className="shrink-0">
                    {hasSearch && (
                        <FilterSection icon={Search} label={t("table.search")} wide>
                            <FormField
                                label={t("table.search")}
                                hideLabel
                                type="search"
                                leftIcon={Search}
                                placeholder={t("table.searchPlaceholder")}
                                value={search}
                                onChange={(event) => setState({ search: event.target.value, page: 1 })}
                            />
                        </FilterSection>
                    )}
                    {filters.map((filter) => (
                        <FilterSection key={filter.key} icon={filter.icon} label={filter.label}>
                            {filter.kind === "multi" ? (
                                <AutocompleteField
                                    multiple
                                    label={filter.label}
                                    hideLabel
                                    options={filter.options}
                                    value={(values[filter.key] as number[] | undefined) ?? []}
                                    placeholder={filter.placeholder}
                                    onChange={(ids) => setValue(filter.key, ids)}
                                />
                            ) : filter.kind === "date" ? (
                                <DateField
                                    label={filter.label}
                                    hideLabel
                                    title={filter.label}
                                    value={(values[filter.key] as string | undefined) ?? ""}
                                    min={filter.min}
                                    max={filter.max}
                                    onChange={(event) => setValue(filter.key, event.target.value)}
                                />
                            ) : (
                                <SelectField
                                    label={filter.label}
                                    hideLabel
                                    options={filter.options}
                                    value={(values[filter.key] as string | undefined) ?? ""}
                                    onChange={(value) => setValue(filter.key, value)}
                                />
                            )}
                        </FilterSection>
                    ))}
                </FiltersPanel>
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-panel border border-tableBorderLight bg-tableLight shadow-soft-md dark:border-tableBorderDark dark:bg-tableDark dark:shadow-deep-md">
                <div aria-busy={isFetching || undefined} className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
                    {isLoading ? (
                        <div role="status" className="flex flex-col">
                            <span className="sr-only">{t("table.loading")}</span>
                            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                                <div key={i} aria-hidden="true" className="flex h-12 items-center border-b border-tableBorderLight px-4 dark:border-tableBorderDark">
                                    <span className="h-3 w-2/3 animate-pulse rounded-xs bg-skeletonLight dark:bg-skeletonDark" />
                                </div>
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="flex justify-center px-4 py-8">
                            <Button variant="outline" size="sm" leftIcon={RotateCcw} onClick={onRetry} className="min-h-10">
                                {t("table.retry")}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <ul className="flex flex-col divide-y divide-tableBorderLight dark:divide-tableBorderDark md:hidden">
                                {paginated.length === 0 && <li>{emptyState}</li>}
                                {paginated.map((row) => (
                                    <li key={row.id} className="flex flex-col gap-1.5 px-4 py-3 text-sm even:bg-tableStripeLight dark:even:bg-tableStripeDark">
                                        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                                            {columns.map((column) => (
                                                <div key={column.key} className="contents">
                                                    <dt className="text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">{column.label}</dt>
                                                    <dd className="min-w-0 break-words">{cellValue(row, column)}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                        {hasActions && actions(row)}
                                    </li>
                                ))}
                            </ul>

                            <table className="hidden w-full border-separate border-spacing-0 text-sm md:table">
                                <thead>
                                    <tr>
                                        {columns.map((column) => (
                                            <th key={column.key} scope="col" style={{ width: column.width }} className={`${headCell} ${column.align === "right" ? "text-right" : "text-left"} ${column.className ?? ""}`}>
                                                {column.label}
                                            </th>
                                        ))}
                                        {hasActions && <th scope="col" className={`${headCell} text-right`}>{t("table.actions")}</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 ? (
                                        <tr><td colSpan={colSpan}>{emptyState}</td></tr>
                                    ) : (
                                        paginated.map((row) => (
                                            <tr key={row.id} className="transition-colors even:bg-tableStripeLight dark:even:bg-tableStripeDark hover:bg-tableHoverLight dark:hover:bg-tableHoverDark [&>td]:border-b [&>td]:border-tableBorderLight dark:[&>td]:border-tableBorderDark [&:last-child>td]:border-b-0">
                                                {columns.map((column) => (
                                                    <td key={column.key} className={`px-3 py-1.5 align-middle ${column.align === "right" ? "text-right tabular-nums" : ""} ${column.className ?? ""}`}>
                                                        {cellValue(row, column)}
                                                    </td>
                                                ))}
                                                {hasActions && <td className="w-px whitespace-nowrap px-3 py-1">{actions(row)}</td>}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                {!isLoading && !isError && (
                    <nav aria-label={t("table.pagination")} className="flex shrink-0 flex-col items-center gap-2 border-t border-tableBorderLight bg-tableFooterLight px-3 py-1.5 text-sm dark:border-tableBorderDark dark:bg-tableFooterDark sm:flex-row sm:justify-between">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="text-xs text-fontMutedLight dark:text-fontMutedDark">
                                {t("table.range", { from: total === 0 ? 0 : start + 1, to: Math.min(start + pageSize, total), total })}
                            </span>
                            <div className="w-32">
                                <SelectField
                                    label={t("table.rowsPerPage")}
                                    hideLabel
                                    value={pageSize}
                                    options={PAGE_SIZE_OPTIONS.map((size) => ({ value: size, label: t("table.rows", { count: size }) }))}
                                    onChange={(size) => setState({ pageSize: size, page: 1 })}
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-0.5">
                            <Button variant="ghost" size="sm" icon={ChevronsLeft} aria-label={t("table.first")} disabled={safePage === 1} onClick={() => setPage(1)} className={ICON_BUTTON} />
                            <Button variant="ghost" size="sm" icon={ChevronLeft} aria-label={t("table.previous")} disabled={safePage === 1} onClick={() => setPage(safePage - 1)} className={ICON_BUTTON} />
                            {pageWindow.map((number) => (
                                <Button
                                    key={number}
                                    variant="menu"
                                    size="sm"
                                    aria-label={t("table.page", { page: number })}
                                    aria-current={number === safePage ? "page" : undefined}
                                    onClick={() => setPage(number)}
                                    className="min-h-10 min-w-10 justify-center tabular-nums"
                                >
                                    {number}
                                </Button>
                            ))}
                            <Button variant="ghost" size="sm" icon={ChevronRight} aria-label={t("table.next")} disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} className={ICON_BUTTON} />
                            <Button variant="ghost" size="sm" icon={ChevronsRight} aria-label={t("table.last")} disabled={safePage === totalPages} onClick={() => setPage(totalPages)} className={ICON_BUTTON} />
                        </div>
                    </nav>
                )}
            </div>
        </div>
    );
}
