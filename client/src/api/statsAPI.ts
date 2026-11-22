import { type ApiResponse, unwrap } from "./apiTypes";
import { authorizedAxios } from "./authorizedAxios";
import type { Challenge, ChallengePayload, Stats } from "../types/stats-types/statsTypes";

export const getStatsQuery = async ({ year, tz }: { year: number | null; tz: string }): Promise<Stats> =>
    unwrap(await authorizedAxios("stats").get<ApiResponse<Stats>>("", { params: { tz, ...(year === null ? {} : { year }) } }));

export const setChallengeMutation = async ({ year, data }: { year: number; data: ChallengePayload }): Promise<Challenge> =>
    unwrap(await authorizedAxios("challenges").put<ApiResponse<Challenge>>(`/${year}`, data, { handlesFieldErrors: true }));

export const deleteChallengeMutation = async (year: number): Promise<void> => {
    await authorizedAxios("challenges").delete(`/${year}`);
};
