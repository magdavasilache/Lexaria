import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toggleCommentLike } from "../../../api/likesAPI";

export const useToggleCommentLike = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: toggleCommentLike,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
              queryKey: ["comments", variables],
            });
          },
    })
}