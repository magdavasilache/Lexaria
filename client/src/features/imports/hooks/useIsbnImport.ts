import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importIsbnMutation, previewIsbnQuery } from "../api/importsAPI";
import { bookKeys } from "../../books/hooks/bookKeys";
import { catalogKeys } from "../../catalog/hooks/catalogKeys";
import { readingKeys } from "../../reading/hooks/readingKeys";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";

export const useIsbnPreview = () => useMutation({ mutationFn: previewIsbnQuery });

export const useIsbnImport = () => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: importIsbnMutation,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
      queryClient.invalidateQueries({ queryKey: catalogKeys.all });
      queryClient.invalidateQueries({ queryKey: readingKeys.editions(result.book_id) });
      queryClient.invalidateQueries({ queryKey: readingKeys.adminEditions() });
      showSnackBar({ key: result.book_created ? "front/imports:isbn.bookImported" : "front/imports:isbn.editionImported" }, "success");
    },
  });
};
