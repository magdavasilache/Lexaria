import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toggleReviewLike } from "../../../api/likesAPI"

export const useToggleReviewLike = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: toggleReviewLike,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
              queryKey: ["reviews", variables],
            });
            return data
          },
    })
}