import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createLanguageMutation } from "../../../api/languageAPI";

export const useCreateLanguage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLanguageMutation,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["language"],
      });
    },
  });
};