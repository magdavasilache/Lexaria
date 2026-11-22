import type { CatalogKind } from "../catalogTypes";

export const catalogKeys = {
  all: ["catalog"] as const,
  list: (kind: CatalogKind) => [...catalogKeys.all, kind] as const,
};
