import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createCountryMutation } from "../../../api/countryAPI";

export const useCreateCountry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCountryMutation,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
              queryKey: ["country", variables],
            });
          },
    })
}