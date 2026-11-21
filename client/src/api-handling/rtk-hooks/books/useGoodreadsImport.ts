import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importGoodreadsMutation } from "../../../api/booksAPI";
import { bookKeys } from "./bookKeys";

export const useGoodreadsImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importGoodreadsMutation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookKeys.all }),
  });
};
