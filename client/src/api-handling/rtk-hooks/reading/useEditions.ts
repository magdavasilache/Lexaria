import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEditionMutation, deleteEditionMutation, getEditionsPageQuery, getEditionsQuery, updateEditionMutation } from "../../../api/editionsAPI";
import type { Edition, EditionAdmin } from "../../../types/reading-types/editionTypes";
import { bookKeys } from "../books/bookKeys";
import { useSnackbarStore } from "../../context/snackbar/useSnackbarStore";
import { readingKeys } from "./readingKeys";
import { statsKeys } from "../stats/statsKeys";

export const useEditions = (bookId: number, enabled = true) =>
  useQuery({
    queryKey: readingKeys.editions(bookId),
    queryFn: () => getEditionsQuery(bookId),
    enabled,
  });

export const useCreateEdition = (bookId: number) => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: createEditionMutation,
    onSuccess: (edition) => {
      queryClient.setQueryData<Edition[]>(readingKeys.editions(bookId), (editions) => [edition, ...(editions ?? [])]);
      queryClient.invalidateQueries({ queryKey: readingKeys.editions(bookId) });
      queryClient.invalidateQueries({ queryKey: readingKeys.adminEditions() });
      showSnackBar({ key: "front/reading:snackbar.editionAdded" }, "success");
    },
  });
};

const ADMIN_PAGE_SIZE = 100;

const getAllEditions = async (): Promise<EditionAdmin[]> => {
  const editions: EditionAdmin[] = [];
  let total = Infinity;
  while (editions.length < total) {
    const page = await getEditionsPageQuery({ offset: editions.length, limit: ADMIN_PAGE_SIZE });
    editions.push(...page.items);
    total = page.total;
    if (page.items.length === 0) break;
  }
  return editions;
};

export const useAdminEditions = (enabled = true) =>
  useQuery({
    queryKey: readingKeys.adminEditions(),
    queryFn: getAllEditions,
    enabled,
  });

const useRefreshEditions = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: readingKeys.all });
    queryClient.invalidateQueries({ queryKey: bookKeys.all });
    queryClient.invalidateQueries({ queryKey: statsKeys.all });
  };
};

export const useUpdateEdition = () => {
  const refresh = useRefreshEditions();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: updateEditionMutation,
    onSuccess: () => {
      refresh();
      showSnackBar({ key: "front/reading:snackbar.editionUpdated" }, "success");
    },
  });
};

export const useDeleteEdition = () => {
  const refresh = useRefreshEditions();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: deleteEditionMutation,
    onSuccess: () => {
      refresh();
      showSnackBar({ key: "front/reading:snackbar.editionDeleted" }, "success");
    },
  });
};
