import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAuthorMutation } from "../../../api/authorAPI";
import { useSnackbarStore } from "../../context/snackbar/useSnackbarStore";

export const useCreateAuthor = (onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    const showSnackbar = useSnackbarStore(state => state.showSnackBar);

    return useMutation({
        mutationFn: createAuthorMutation,
        onSuccess: (response) => {
            if (response.data.success) {
                showSnackbar(response.data.message, 'success');
                queryClient.invalidateQueries({ queryKey: ["authors"] });
                onSuccess?.();
            } else {
                showSnackbar(response.data.message, 'error');
            }
        },
        onError: () => {
            showSnackbar(
                "Unexpected error while trying to create a new author",
                'error',
                2000,
                'Try again later or contact support!'
            );
        },
    });
};