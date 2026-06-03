import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCommentMutation } from "../../../api/commentsAPI";

export const useCreateComments = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCommentMutation,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
              queryKey: ["comments", variables.review_id],
            });
          },
    })
}