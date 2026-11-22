import { type ApiResponse, unwrap } from "./apiTypes";
import { authorizedAxios } from "./authorizedAxios";
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
} from "../types/reading-types/readingTypes";

export const getActiveSessionQuery = async (): Promise<ActiveSession | null> =>
    unwrap(await authorizedAxios("reading").get<ApiResponse<ActiveSession | null>>("/sessions/active"));

export const startSessionMutation = async ({ bookId, data }: { bookId: number; data: SessionStartPayload }): Promise<ActiveSession> =>
    unwrap(await authorizedAxios("books").post<ApiResponse<ActiveSession>>(`/${bookId}/sessions`, data, { handlesFieldErrors: true }));

export const pauseSessionMutation = async (sessionId: number): Promise<ActiveSession> =>
    unwrap(await authorizedAxios("reading").post<ApiResponse<ActiveSession>>(`/sessions/${sessionId}/pause`));

export const resumeSessionMutation = async (sessionId: number): Promise<ActiveSession> =>
    unwrap(await authorizedAxios("reading").post<ApiResponse<ActiveSession>>(`/sessions/${sessionId}/resume`));

export const endSessionMutation = async ({ sessionId, data }: { sessionId: number; data: SessionEndPayload }): Promise<Reading> =>
    unwrap(await authorizedAxios("reading").post<ApiResponse<Reading>>(`/sessions/${sessionId}/end`, data, { handlesFieldErrors: true }));

export const discardSessionMutation = async (sessionId: number): Promise<void> => {
    await authorizedAxios("reading").delete(`/sessions/${sessionId}`);
};

export const createNoteMutation = async ({ readingId, data }: { readingId: number; data: NotePayload }): Promise<ReadingEvent> =>
    unwrap(await authorizedAxios("readings").post<ApiResponse<ReadingEvent>>(`/${readingId}/notes`, data, { handlesFieldErrors: true }));

export const getJourneyQuery = async (bookId: number): Promise<Journey> =>
    unwrap(await authorizedAxios("books").get<ApiResponse<Journey>>(`/${bookId}/journey`));

export const updateReadingMutation = async ({ readingId, data }: { readingId: number; data: ReadingUpdatePayload }): Promise<Reading> =>
    unwrap(await authorizedAxios("readings").put<ApiResponse<Reading>>(`/${readingId}`, data, { handlesFieldErrors: true }));

export const deleteReadingMutation = async (readingId: number): Promise<void> => {
    await authorizedAxios("readings").delete(`/${readingId}`);
};

export const updateNoteMutation = async ({ noteId, data }: { noteId: number; data: NoteUpdatePayload }): Promise<ReadingEvent> =>
    unwrap(await authorizedAxios("reading").put<ApiResponse<ReadingEvent>>(`/notes/${noteId}`, data, { handlesFieldErrors: true }));

export const deleteNoteMutation = async (noteId: number): Promise<void> => {
    await authorizedAxios("reading").delete(`/notes/${noteId}`);
};

export const getReadingTodayQuery = async (tz: string): Promise<ReadingToday> =>
    unwrap(await authorizedAxios("reading").get<ApiResponse<ReadingToday>>("/today", { params: { tz } }));

export const setReadingGoalMutation = async (data: ReadingGoalPayload): Promise<ReadingGoal> =>
    unwrap(await authorizedAxios("users").put<ApiResponse<ReadingGoal>>("/me/reading-goal", data, { handlesFieldErrors: true }));
