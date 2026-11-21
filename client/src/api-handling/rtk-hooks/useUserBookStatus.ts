import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setUserBookStatusAPI } from "../../api/userBooksStatusAPI";
import { useSnackbarStore } from "../context/snackbar/useSnackbarStore";
import { useReviewsStore } from "../context/reviews/useReviewsStore";
import { bookKeys } from "./books/bookKeys";

export type ReadingStatus = "want_to_read" | "currently_reading" | "read" | "did_not_finish";

export const useUserBookStatus = () => {
    const queryClient = useQueryClient();
    const showSnackBar = useSnackbarStore(state => state.showSnackBar);
    const setOpenReviewForm = useReviewsStore(state => state.setOpenReviewForm);

    return useMutation({
        mutationFn: ({ book_id, status }: { book_id: number; status: ReadingStatus }) =>
            setUserBookStatusAPI.setUserBookStatusMutation(book_id, status),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: bookKeys.detail(data.book_id) });
            showSnackBar({ key: "front/books:status.updated" }, "success");
            if (data.status === "read") setOpenReviewForm(true);
        },
    });
};
