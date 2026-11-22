export const readingKeys = {
  all: ["reading"] as const,
  activeSession: () => [...readingKeys.all, "active-session"] as const,
  journey: (bookId: number) => [...readingKeys.all, "journey", bookId] as const,
  editions: (bookId: number) => [...readingKeys.all, "editions", bookId] as const,
  adminEditions: () => [...readingKeys.all, "editions", "admin"] as const,
  today: () => [...readingKeys.all, "today"] as const,
};
