import { apiClient } from "../../../shared/api/apiClient";
import type {
    ActiveSession,
    Journey,
    NotePayload,
    NoteUpdatePayload,
    Reading,
    ReadingEvent,
    ReadingGoal,
    ReadingGoalPayload,
    ReadingToday,
    ReadingUpdatePayload,
    SessionEndPayload,
    SessionStartPayload,
} from "../types/readingTypes";

const fieldErrors = { handlesFieldErrors: true };

export const getActiveSessionQuery = (): Promise<ActiveSession | null> => apiClient.get<ActiveSession | null>("/reading/sessions/active");

export const startSessionMutation = ({ bookId, data }: { bookId: number; data: SessionStartPayload }): Promise<ActiveSession> =>
    apiClient.post<ActiveSession>(`/books/${bookId}/sessions`, data, fieldErrors);

export const pauseSessionMutation = (sessionId: number): Promise<ActiveSession> => apiClient.post<ActiveSession>(`/reading/sessions/${sessionId}/pause`);

export const resumeSessionMutation = (sessionId: number): Promise<ActiveSession> => apiClient.post<ActiveSession>(`/reading/sessions/${sessionId}/resume`);

export const endSessionMutation = ({ sessionId, data }: { sessionId: number; data: SessionEndPayload }): Promise<Reading> =>
    apiClient.post<Reading>(`/reading/sessions/${sessionId}/end`, data, fieldErrors);

export const discardSessionMutation = (sessionId: number): Promise<void> => apiClient.delete(`/reading/sessions/${sessionId}`);

export const createNoteMutation = ({ readingId, data }: { readingId: number; data: NotePayload }): Promise<ReadingEvent> =>
    apiClient.post<ReadingEvent>(`/readings/${readingId}/notes`, data, fieldErrors);

export const getJourneyQuery = (bookId: number): Promise<Journey> => apiClient.get<Journey>(`/books/${bookId}/journey`);

export const updateReadingMutation = ({ readingId, data }: { readingId: number; data: ReadingUpdatePayload }): Promise<Reading> =>
    apiClient.put<Reading>(`/readings/${readingId}`, data, fieldErrors);

export const deleteReadingMutation = (readingId: number): Promise<void> => apiClient.delete(`/readings/${readingId}`);

export const updateNoteMutation = ({ noteId, data }: { noteId: number; data: NoteUpdatePayload }): Promise<ReadingEvent> =>
    apiClient.put<ReadingEvent>(`/reading/notes/${noteId}`, data, fieldErrors);

export const deleteNoteMutation = (noteId: number): Promise<void> => apiClient.delete(`/reading/notes/${noteId}`);

export const getReadingTodayQuery = (tz: string): Promise<ReadingToday> => apiClient.get<ReadingToday>("/reading/today", { params: { tz } });

export const setReadingGoalMutation = (data: ReadingGoalPayload): Promise<ReadingGoal> =>
    apiClient.put<ReadingGoal>("/users/me/reading-goal", data, fieldErrors);
