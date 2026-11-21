export const READING_STATUSES = ["want_to_read", "currently_reading", "read", "did_not_finish"] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

export type UserBookStatus = {
    user_id: number;
    book_id: number;
    status: ReadingStatus;
    added_at: string;
    updated_at: string;
};
