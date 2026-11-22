import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getReadingTodayQuery, setReadingGoalMutation } from "../api/readingAPI";
import type { ReadingToday } from "../types/readingTypes";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";
import { timeZone } from "../../../shared/utils/timeZone";
import { readingKeys } from "./readingKeys";

export const useReadingToday = (enabled = true) =>
  useQuery({
    queryKey: readingKeys.today(),
    queryFn: () => getReadingTodayQuery(timeZone()),
    enabled,
  });

export const useSetReadingGoal = () => {
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: setReadingGoalMutation,
    onSuccess: (goal) => {
      queryClient.setQueryData<ReadingToday>(readingKeys.today(), (today) => (today ? { ...today, ...goal } : today));
      showSnackBar({ key: goal.daily_reading_goal_minutes === null ? "front/reading:snackbar.goalCleared" : "front/reading:snackbar.goalSet" }, "success");
    },
  });
};
