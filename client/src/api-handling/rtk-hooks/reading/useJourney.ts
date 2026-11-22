import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteNoteMutation, deleteReadingMutation, getJourneyQuery, updateNoteMutation, updateReadingMutation } from "../../../api/readingAPI";
import { useSnackbarStore } from "../../context/snackbar/useSnackbarStore";
import { bookKeys } from "../books/bookKeys";
import { readingKeys } from "./readingKeys";
import { statsKeys } from "../stats/statsKeys";

export const useJourney = (bookId: number) =>
  useQuery({
    queryKey: readingKeys.journey(bookId),
    queryFn: () => getJourneyQuery(bookId),
  });

const useRefreshJourney = (bookId: number) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: readingKeys.journey(bookId) });
    queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    queryClient.invalidateQueries({ queryKey: readingKeys.activeSession() });
    queryClient.invalidateQueries({ queryKey: statsKeys.all });
  };
};

export const useUpdateReading = (bookId: number) => {
  const refresh = useRefreshJourney(bookId);
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);
  return useMutation({
    mutationFn: updateReadingMutation,
    onSuccess: () => {
      refresh();
      showSnackBar({ key: "front/reading:snackbar.readingUpdated" }, "success");
    },
  });
};

export const useDeleteReading = (bookId: number) => {
  const refresh = useRefreshJourney(bookId);
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);
  return useMutation({
    mutationFn: deleteReadingMutation,
    onSuccess: () => {
      refresh();
      showSnackBar({ key: "front/reading:snackbar.readingDeleted" }, "success");
    },
  });
};

export const useUpdateNote = (bookId: number) => {
  const refresh = useRefreshJourney(bookId);
  return useMutation({ mutationFn: updateNoteMutation, onSuccess: refresh });
};

export const useDeleteNote = (bookId: number) => {
  const refresh = useRefreshJourney(bookId);
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);
  return useMutation({
    mutationFn: deleteNoteMutation,
    onSuccess: () => {
      refresh();
      showSnackBar({ key: "front/reading:snackbar.noteDeleted" }, "success");
    },
  });
};
