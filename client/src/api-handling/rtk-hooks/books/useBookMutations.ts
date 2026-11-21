import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBookMutation, deleteBookMutation, updateBookMutation } from "../../../api/booksAPI";
import { useSnackbarStore } from "../../context/snackbar/useSnackbarStore";
import { bookKeys } from "./bookKeys";

export const useCreateBook = () => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: createBookMutation,
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
      showSnackBar({ key: "front/books:admin.created", params: { title: book.title } }, "success");
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: updateBookMutation,
    onSuccess: (book) => {
      queryClient.setQueryData(bookKeys.detail(book.id), book);
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.admin() });
      showSnackBar({ key: "front/books:admin.updated", params: { title: book.title } }, "success");
    },
  });
};

export const useDeleteBook = () => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: ({ bookId }: { bookId: number; title: string }) => deleteBookMutation(bookId),
    onSuccess: (_, { bookId, title }) => {
      queryClient.removeQueries({ queryKey: bookKeys.detail(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.admin() });
      showSnackBar({ key: "front/books:admin.deleted", params: { title } }, "success");
    },
  });
};
