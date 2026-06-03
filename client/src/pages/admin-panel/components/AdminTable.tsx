import { useMemo, useState } from "react";

export interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (row: T) => React.ReactNode;
    width?: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50];

interface Props<T extends { id: number }> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    searchKeys?: (keyof T)[];
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onView?: (row: T) => void;
    defaultPageSize?: number;
}

export function AdminTable<T extends { id: number }>({
    data,
    columns,
    isLoading,
    searchKeys = [],
    onEdit,
    onDelete,
    onView,
    defaultPageSize = 10,
}: Props<T>) {
    const [search, setSearch] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const filtered = useMemo(() => {
        setPage(1);
        if (!search.trim() || !searchKeys.length) return data;
        const q = search.toLowerCase();
        return data.filter((row) =>
            searchKeys.some((key) =>
                String(row[key] ?? "").toLowerCase().includes(q)
            )
        );
    }, [data, search, searchKeys]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);

    const paginated = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    // Page window: always show max 5 page buttons
    const pageWindow = useMemo(() => {
        const delta = 2;
        const start = Math.max(1, safePage - delta);
        const end = Math.min(totalPages, safePage + delta);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }, [safePage, totalPages]);

    const handleDelete = (row: T) => {
        if (deletingId === row.id) {
            onDelete?.(row);
            setDeletingId(null);
        } else {
            setDeletingId(row.id);
            setTimeout(() => setDeletingId(null), 3000);
        }
    };

    const hasActions = onEdit || onDelete || onView;

    return (
        <div className="flex flex-col gap-3 h-full">

            {/* Search + page size */}
            <div className="flex items-center justify-between gap-4">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="
                        w-full max-w-sm px-3 py-2 text-sm rounded-xs
                        bg-inputLight dark:bg-inputDark
                        border border-dividerLight dark:border-dividerDark
                        outline-none focus:border-primaryLight dark:focus:border-primaryDark
                        text-fontPrimaryLight dark:text-fontSecondaryDark
                        transition-colors
                    "
                />
                <div className="flex items-center gap-2 text-sm opacity-60 shrink-0">
                    <span>Rows:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        className="
                            bg-inputLight dark:bg-inputDark
                            border border-dividerLight dark:border-dividerDark
                            rounded-xs px-2 py-1 text-sm outline-none
                            text-fontPrimaryLight dark:text-fontSecondaryDark
                        "
                    >
                        {PAGE_SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto rounded-xs border border-dividerLight dark:border-dividerDark flex-1">
                <table className="w-full text-sm text-fontPrimaryLight dark:text-fontSecondaryDark">
                    <thead>
                        <tr className="border-b border-dividerLight dark:border-dividerDark bg-paperLight dark:bg-paperDark">
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    className="px-4 py-3 text-left text-xs uppercase tracking-wider opacity-60 font-semibold"
                                    style={{ width: col.width }}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {hasActions && (
                                <th className="px-4 py-3 text-right text-xs uppercase tracking-wider opacity-60 font-semibold w-[140px]">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: pageSize }).map((_, i) => (
                                <tr key={i} className="border-b border-dividerLight dark:border-dividerDark">
                                    {columns.map((col) => (
                                        <td key={String(col.key)} className="px-4 py-3">
                                            <div className="h-4 rounded bg-dividerLight dark:bg-dividerDark animate-pulse" />
                                        </td>
                                    ))}
                                    {hasActions && <td className="px-4 py-3" />}
                                </tr>
                            ))
                        ) : paginated.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (hasActions ? 1 : 0)}
                                    className="px-4 py-8 text-center opacity-40"
                                >
                                    No results found
                                </td>
                            </tr>
                        ) : (
                            paginated.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-dividerLight dark:border-dividerDark hover:bg-inputLight dark:hover:bg-inputDark transition-colors dark:hover:text-fontPrimaryLight"
                                >
                                    {columns.map((col) => (
                                        <td key={String(col.key)} className="px-4 py-3">
                                            {col.render
                                                ? col.render(row)
                                                : String((row as any)[col.key] ?? "—")}
                                        </td>
                                    ))}
                                    {hasActions && (
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                {onView && (
                                                    <button onClick={() => onView(row)}
                                                        className="px-2.5 py-1 text-xs rounded-xs border border-dividerLight dark:border-dividerDark hover:border-primaryLight dark:hover:border-primaryDark transition-colors opacity-70 hover:opacity-100">
                                                        View
                                                    </button>
                                                )}
                                                {onEdit && (
                                                    <button onClick={() => onEdit(row)}
                                                        className="px-2.5 py-1 text-xs rounded-xs border border-dividerLight dark:border-dividerDark hover:border-primaryLight dark:hover:border-primaryDark transition-colors opacity-70 hover:opacity-100">
                                                        Edit
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button onClick={() => handleDelete(row)}
                                                        className={`px-2.5 py-1 text-xs rounded-xs border transition-all
                                                            ${deletingId === row.id
                                                                ? "border-red-500 text-red-500 bg-red-500/10"
                                                                : "border-dividerLight dark:border-dividerDark opacity-70 hover:opacity-100 hover:border-red-400 hover:text-red-400"
                                                            }`}>
                                                        {deletingId === row.id ? "Confirm?" : "Delete"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && (
                <div className="flex items-center justify-between text-sm shrink-0">
                    <span className="opacity-40 text-xs">
                        {filtered.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)}`} of {filtered.length}
                    </span>

                    <div className="flex items-center gap-1">
                        {/* First + Prev */}
                        <PaginationBtn onClick={() => setPage(1)} disabled={safePage === 1}>«</PaginationBtn>
                        <PaginationBtn onClick={() => setPage((p) => p - 1)} disabled={safePage === 1}>‹</PaginationBtn>

                        {/* Show ellipsis if window doesn't start at 1 */}
                        {pageWindow[0] > 1 && (
                            <span className="px-2 opacity-30">...</span>
                        )}

                        {pageWindow.map((p) => (
                            <PaginationBtn
                                key={p}
                                onClick={() => setPage(p)}
                                active={p === safePage}
                            >
                                {p}
                            </PaginationBtn>
                        ))}

                        {/* Show ellipsis if window doesn't end at last page */}
                        {pageWindow[pageWindow.length - 1] < totalPages && (
                            <span className="px-2 opacity-30">...</span>
                        )}

                        {/* Next + Last */}
                        <PaginationBtn onClick={() => setPage((p) => p + 1)} disabled={safePage === totalPages}>›</PaginationBtn>
                        <PaginationBtn onClick={() => setPage(totalPages)} disabled={safePage === totalPages}>»</PaginationBtn>
                    </div>
                </div>
            )}
        </div>
    );
}

function PaginationBtn({
    children,
    onClick,
    disabled,
    active,
}: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-8 h-8 flex items-center justify-center rounded-xs text-xs
                border transition-all
                ${active
                    ? "bg-primaryLight dark:bg-primaryDark text-white border-primaryLight dark:border-primaryDark"
                    : "border-dividerLight dark:border-dividerDark opacity-60 hover:opacity-100 hover:border-primaryLight dark:hover:border-primaryDark"
                }
                disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:border-dividerLight
            `}
        >
            {children}
        </button>
    );
}