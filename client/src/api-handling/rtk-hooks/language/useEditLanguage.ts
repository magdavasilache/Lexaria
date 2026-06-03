import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editLanguageMutation } from "../../../api/languageAPI";
import { LanguageUpdate } from "../../../types/language/languageTypes";

export const useEditLanguage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, language }: { id: number; language: LanguageUpdate }) =>
            editLanguageMutation(id, language),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["language"],
            });
        },
    });
};