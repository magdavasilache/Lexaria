import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteChallengeMutation, getStatsQuery, setChallengeMutation } from "../api/statsAPI";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";
import { timeZone } from "../../../shared/utils/timeZone";
import { statsKeys } from "./statsKeys";

export const useStats = (year: number | null) =>
  useQuery({
    queryKey: statsKeys.year(year),
    queryFn: () => getStatsQuery({ year, tz: timeZone() }),
    placeholderData: keepPreviousData,
  });

export const useSetChallenge = () => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: setChallengeMutation,
    onSuccess: (challenge) => {
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
      showSnackBar({ key: "front/stats:snackbar.challengeSaved", params: { year: challenge.year } }, "success");
    },
  });
};

export const useDeleteChallenge = () => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: deleteChallengeMutation,
    onSuccess: (_, year) => {
      queryClient.invalidateQueries({ queryKey: statsKeys.all });
      showSnackBar({ key: "front/stats:snackbar.challengeDeleted", params: { year } }, "success");
    },
  });
};
