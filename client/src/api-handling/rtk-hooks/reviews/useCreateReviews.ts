import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReviewMutation } from "../../../api/reviewsAPI";

export const useCreateReviews = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: createReviewMutation,
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ["reviews", variables.book_id],
        });
      },
    });
}