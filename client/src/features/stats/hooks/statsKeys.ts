export const statsKeys = {
  all: ["stats"] as const,
  year: (year: number | null) => [...statsKeys.all, year ?? "current"] as const,
};
