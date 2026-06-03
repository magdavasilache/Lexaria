import { useMutation } from "@tanstack/react-query";
import { useUserBookStatusStore } from "../context/user_book_status/useUserBookStatusStore";
import { setUserBookStatusAPI } from "../../api/userBooksStatusAPI";
import { useSnackbarStore } from "../context/snackbar/useSnackbarStore";
import { useReviewsStore } from "../context/reviews/useReviewsStore";

export const useUserBookStatus = () => {
    const setUserBookStatus = useUserBookStatusStore(state => state.setUserBookStatus)
    const showSnackBar = useSnackbarStore(state => state.showSnackBar)
    const setOpenReviewForm = useReviewsStore(state => state.setOpenReviewForm);

    return useMutation({
        mutationFn: (params: { book_id: number; status: 'want_to_read' | 'currently_reading' | 'read' | 'did_not_finish' }) => {
            const { book_id, status } = params;
            const response = setUserBookStatusAPI.setUserBookStatusMutation(book_id, status);
            return response;
        },
        onSuccess: (data) => {
            setUserBookStatus(data);
            showSnackBar("Book status updated successfully!", 'success');
            if(data.status === 'read'){
                setOpenReviewForm(true);
            }
        },
        onError: () => {
            showSnackBar("Failed to update book status.", 'error');
        }
    });
};