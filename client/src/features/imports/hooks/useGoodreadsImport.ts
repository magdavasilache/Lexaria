import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importGoodreadsMutation } from "../api/importsAPI";
import { bookKeys } from "../../books/hooks/bookKeys";
import { statsKeys } from "../../stats/hooks/statsKeys";

export const useGoodreadsImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importGoodreadsMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
    },
  });
};
