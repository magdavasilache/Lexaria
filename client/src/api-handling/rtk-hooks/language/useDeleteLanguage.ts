import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteLanguageMutation } from "../../../api/languageAPI";

export const useDeleteLanguage = () => {
    const qc = useQueryClient();
  
    return useMutation({
      mutationFn: deleteLanguageMutation,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["language"] });
      },
    });
  };