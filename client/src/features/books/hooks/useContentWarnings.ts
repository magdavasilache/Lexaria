import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeContentWarningsMutation, setContentWarningsMutation } from "../api/booksAPI";
import type { BookDetail, ContentWarnings, ContentWarningsPayload } from "../types/bookTypes";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";
import { bookKeys } from "./bookKeys";

export const useContentWarnings = (bookId: number) => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  const store = (warnings: ContentWarnings) => {
    queryClient.setQueryData<BookDetail>(bookKeys.detail(bookId), (book) => (book ? { ...book, content_warnings: warnings } : book));
    queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
  };

  const save = useMutation({
    mutationFn: (payload: ContentWarningsPayload) => setContentWarningsMutation({ bookId, payload }),
    onSuccess: (warnings) => {
      store(warnings);
      showSnackBar({ key: "front/books:warnings.saved" }, "success");
    },
  });

  const remove = useMutation({
    mutationFn: () => removeContentWarningsMutation(bookId),
    onSuccess: (warnings) => {
      store(warnings);
      showSnackBar({ key: "front/books:warnings.removed" }, "success");
    },
  });

  return { save, remove };
};
