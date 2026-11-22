import type { Schema } from "../../api/apiTypes";

export type ReadingStatus = Schema<"ReadingStatus">;
export const READING_STATUSES = ["want_to_read", "currently_reading", "read", "did_not_finish"] as const satisfies readonly ReadingStatus[];

export type UserBookStatus = Schema<"UserBookStatusOut">;
export type UserBookStatusPayload = Schema<"UserBookStatusSet">;
