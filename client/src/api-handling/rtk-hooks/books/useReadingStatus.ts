import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeReadingStatusMutation, setReadingStatusMutation } from "../../../api/userBooksStatusAPI";
import type { BookDetail } from "../../../types/book-types/bookTypes";
import type { ReadingStatus, UserBookStatus } from "../../../types/user-book-status-types/UserBookStatusTypes";
import { useReviewsStore } from "../../context/reviews/useReviewsStore";
import { useSnackbarStore } from "../../context/snackbar/useSnackbarStore";
import { readingKeys } from "../reading/readingKeys";
import { bookKeys } from "./bookKeys";
import { statsKeys } from "../stats/statsKeys";

export const useReadingStatus = (bookId: number) => {
    const queryClient = useQueryClient();
    const showSnackBar = useSnackbarStore((state) => state.showSnackBar);
    const setOpenReviewForm = useReviewsStore((state) => state.setOpenReviewForm);
    const key = bookKeys.detail(bookId);

    const setCachedStatus = (update: (current: UserBookStatus | null) => UserBookStatus | null) =>
        queryClient.setQueryData<BookDetail>(key, (book) => (book ? { ...book, user_book_status: update(book.user_book_status) } : book));

    return useMutation<UserBookStatus | null, Error, ReadingStatus | null, { previous: UserBookStatus | null }>({
        mutationFn: async (status) => {
            if (status === null) {
                await removeReadingStatusMutation(bookId);
                return null;
            }
            return setReadingStatusMutation({ bookId, status });
        },
        onMutate: async (status) => {
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<BookDetail>(key)?.user_book_status ?? null;
            const now = new Date().toISOString();
            setCachedStatus((current) =>
                status === null
                    ? null
                    : { user_id: current?.user_id ?? 0, book_id: bookId, status, added_at: current?.added_at ?? now, updated_at: now }
            );
            return { previous };
        },
        onError: (_, __, context) => setCachedStatus(() => context?.previous ?? null),
        onSuccess: (result, status) => {
            setCachedStatus(() => result);
            queryClient.invalidateQueries({ queryKey: key });
            queryClient.invalidateQueries({ queryKey: readingKeys.activeSession() });
            queryClient.invalidateQueries({ queryKey: readingKeys.journey(bookId) });
            queryClient.invalidateQueries({ queryKey: statsKeys.all });
            showSnackBar({ key: status === null ? "front/books:status.removed" : "front/books:status.updated" }, "success");
            if (status === "read") setOpenReviewForm(true);
        },
    });
};
