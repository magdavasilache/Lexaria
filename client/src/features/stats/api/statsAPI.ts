import { apiClient } from "../../../shared/api/apiClient";
import type { Challenge, ChallengePayload, Stats } from "../statsTypes";

export const getStatsQuery = ({ year, tz }: { year: number | null; tz: string }): Promise<Stats> =>
    apiClient.get<Stats>("/stats", { params: { tz, ...(year === null ? {} : { year }) } });

export const setChallengeMutation = ({ year, data }: { year: number; data: ChallengePayload }): Promise<Challenge> =>
    apiClient.put<Challenge>(`/challenges/${year}`, data, { handlesFieldErrors: true });

export const deleteChallengeMutation = (year: number): Promise<void> => apiClient.delete(`/challenges/${year}`);
