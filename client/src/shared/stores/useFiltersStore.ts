import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type ScopeValues = Record<string, unknown>;

type FiltersState = {
  scopes: Record<string, ScopeValues>;
  patch: (scope: string, values: ScopeValues) => void;
  reset: (scope: string) => void;
};

export const useFiltersStore = create<FiltersState>()(
  devtools(
    persist(
      (set) => ({
        scopes: {},
        patch: (scope, values) =>
          set((state) => ({ scopes: { ...state.scopes, [scope]: { ...state.scopes[scope], ...values } } })),
        reset: (scope) =>
          set((state) => {
            const scopes = { ...state.scopes };
            delete scopes[scope];
            return { scopes };
          }),
      }),
      {
        name: "filters-store",
        version: 1,
        partialize: (state) => ({ scopes: state.scopes }),
      }
    )
  )
);

export const resetAllFilters = () => useFiltersStore.setState({ scopes: {} });

export function useScopedFilters<T extends ScopeValues>(scope: string, defaults: T) {
  const stored = useFiltersStore((state) => state.scopes[scope]);
  const patch = useFiltersStore((state) => state.patch);
  const reset = useFiltersStore((state) => state.reset);

  const filters = { ...defaults, ...stored } as T;
  const setFilters = (values: Partial<T>) => patch(scope, values);
  const clearFilters = () => reset(scope);

  return { filters, setFilters, clearFilters };
}
