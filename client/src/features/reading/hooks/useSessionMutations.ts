import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createNoteMutation,
  discardSessionMutation,
  endSessionMutation,
  pauseSessionMutation,
  resumeSessionMutation,
  startSessionMutation,
} from "../api/readingAPI";
import type { ActiveSession } from "../types/readingTypes";
import { useReadingSessionStore } from "../stores/useReadingSessionStore";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";
import { bookKeys } from "../../books/hooks/bookKeys";
import { readingKeys } from "./readingKeys";
import { statsKeys } from "../../stats/hooks/statsKeys";

const useRefreshReading = () => {
  const queryClient = useQueryClient();
  return (bookId: number) => {
    queryClient.invalidateQueries({ queryKey: readingKeys.journey(bookId) });
    queryClient.invalidateQueries({ queryKey: readingKeys.today() });
    queryClient.invalidateQueries({ queryKey: statsKeys.all });
    queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
  };
};

const useSetActiveSession = () => {
  const queryClient = useQueryClient();
  return (session: ActiveSession | null) => queryClient.setQueryData(readingKeys.activeSession(), session);
};

export const useStartSession = () => {
  const refreshReading = useRefreshReading();
  const setActiveSession = useSetActiveSession();
  const setMinimized = useReadingSessionStore((state) => state.setMinimized);

  return useMutation({
    mutationFn: startSessionMutation,
    onSuccess: (session) => {
      setActiveSession(session);
      setMinimized(false);
      refreshReading(session.book_id);
    },
  });
};

type PauseVariables = { session: ActiveSession; elapsedSeconds: number };

export const useTogglePause = () => {
  const queryClient = useQueryClient();
  const setActiveSession = useSetActiveSession();

  return useMutation<ActiveSession, Error, PauseVariables, { previous: ActiveSession | null }>({
    mutationFn: ({ session }) => (session.is_paused ? resumeSessionMutation(session.id) : pauseSessionMutation(session.id)),
    onMutate: async ({ session, elapsedSeconds }) => {
      await queryClient.cancelQueries({ queryKey: readingKeys.activeSession() });
      const previous = queryClient.getQueryData<ActiveSession | null>(readingKeys.activeSession()) ?? null;
      setActiveSession({
        ...session,
        is_paused: !session.is_paused,
        paused_at: session.is_paused ? null : new Date().toISOString(),
        elapsed_seconds: elapsedSeconds,
      });
      return { previous };
    },
    onError: (_, __, context) => {
      setActiveSession(context?.previous ?? null);
      queryClient.invalidateQueries({ queryKey: readingKeys.activeSession() });
    },
    onSuccess: (session) => setActiveSession(session),
  });
};

export const useEndSession = (bookId: number) => {
  const refreshReading = useRefreshReading();
  const setActiveSession = useSetActiveSession();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: endSessionMutation,
    onSuccess: (reading) => {
      setActiveSession(null);
      refreshReading(bookId);
      showSnackBar({ key: reading.state === "finished" ? "front/reading:snackbar.finished" : "front/reading:snackbar.ended" }, "success");
    },
  });
};

export const useDiscardSession = (bookId: number) => {
  const refreshReading = useRefreshReading();
  const setActiveSession = useSetActiveSession();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: discardSessionMutation,
    onSuccess: () => {
      setActiveSession(null);
      refreshReading(bookId);
      showSnackBar({ key: "front/reading:snackbar.discarded" }, "success");
    },
  });
};

export const useAddNote = (bookId: number) => {
  const refreshReading = useRefreshReading();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  return useMutation({
    mutationFn: createNoteMutation,
    onSuccess: () => {
      refreshReading(bookId);
      showSnackBar({ key: "front/reading:snackbar.noteAdded" }, "success");
    },
  });
};
