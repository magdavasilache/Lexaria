// api-handling/rtk-hooks/chatbot/useHistory.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizedAxios } from "../../../api/authorizedAxios";
import { TrainingRecord, UnknownMessage } from "../../../types/chatbot-types";

const BASE = "ml";


export const getTrainingHistoryQuery = async (): Promise<TrainingRecord[]> => {
    const response = await authorizedAxios(`${BASE}/trainings`).get("");
    if (response.status === 200) return response.data;
    return [];
};

export const getUnknownMessagesQuery = async (): Promise<UnknownMessage[]> => {
    const response = await authorizedAxios(`${BASE}/unknown-messages`).get("");
    if (response.status === 200) return response.data;
    return [];
};

export const deleteUnknownMutation = async (id: number): Promise<void> => {
    await authorizedAxios(`${BASE}/unknown-messages/${id}`).delete("");
};

export const promoteUnknownMutation = async ({
    id,
    intentId,
}: {
    id: number;
    intentId: number;
}): Promise<void> => {
    await authorizedAxios(`${BASE}/unknown-messages/${id}/promote`).post("", {
        intent_id: intentId,
    });
};


export const useGetTrainingHistory = () =>
    useQuery({
        queryKey: ["training-history"],
        queryFn: getTrainingHistoryQuery,
    });

export const useGetUnknownMessages = () =>
    useQuery({
        queryKey: ["unknown-messages"],
        queryFn: getUnknownMessagesQuery,
    });

export const useDeleteUnknown = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteUnknownMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["unknown-messages"] });
        },
    });
};

export const usePromoteUnknown = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: promoteUnknownMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["unknown-messages"] });
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};