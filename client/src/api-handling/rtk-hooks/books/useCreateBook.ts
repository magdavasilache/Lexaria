import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbarStore } from "../../context/snackbar/useSnackbarStore";
import { booksAPI } from "../../../api/booksAPI";

export const useCreateBook = (onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    const showSnackbar = useSnackbarStore(state => state.showSnackBar);

    return useMutation({
        mutationFn: booksAPI.createBookMutation,
        onSuccess: (response) => {
            if (response.data.success) {
                showSnackbar(response.data.message, 'success');
                queryClient.invalidateQueries({ queryKey: ["books"] });
                onSuccess?.();
            } else {
                showSnackbar(response.data.message, 'error');
            }
        },
        onError: () => {
            showSnackbar(
                "Unexpected error while trying to create a new book",
                'error',
                2000,
                'Try again later or contact support!'
            );
        },
    });
};