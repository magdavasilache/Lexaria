import { useScopedFilters } from "../../stores/useFiltersStore";

export type FilterValue = number[] | string;

export type TableState = { search: string; page: number; pageSize: number; values: Record<string, FilterValue> };

export const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function useDataTableState(stateKey: string, defaultPageSize = PAGE_SIZE_OPTIONS[0]) {
    const defaults: TableState = { search: "", page: 1, pageSize: defaultPageSize, values: {} };
    const { filters: state, setFilters: setState } = useScopedFilters(`table.${stateKey}`, defaults);
    return { state, setState };
}
