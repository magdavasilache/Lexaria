import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeReaderVoteMutation, setReaderVoteMutation } from "../api/booksAPI";
import type { BookDetail, ReaderSignals, ReaderVotePayload } from "../types/bookTypes";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";
import { bookKeys } from "./bookKeys";

export const useReaderVote = (bookId: number) => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  const store = (signals: ReaderSignals) => {
    queryClient.setQueryData<BookDetail>(bookKeys.detail(bookId), (book) => (book ? { ...book, reader_signals: signals } : book));
    queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
  };

  const save = useMutation({
    mutationFn: (payload: ReaderVotePayload) => setReaderVoteMutation({ bookId, payload }),
    onSuccess: (signals) => {
      store(signals);
      showSnackBar({ key: "front/books:signals.saved" }, "success");
    },
  });

  const remove = useMutation({
    mutationFn: () => removeReaderVoteMutation(bookId),
    onSuccess: (signals) => {
      store(signals);
      showSnackBar({ key: "front/books:signals.removed" }, "success");
    },
  });

  return { save, remove };
};
