import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import {
    Intent,
    IntentCreate,
    IntentUpdate,
    PatternCreate,
    PatternUpdate,
    ResponseCreate,
    ResponseUpdate,
} from "../../../types/chatbot-types";
import { authorizedAxios } from "../../../api/authorizedAxios";

const URL_BASE = "ml";

export const getIntentsQuery = async (): Promise<Intent[]> => {
    const response = await authorizedAxios(URL_BASE).get("");
    if (response.status === 200) return response.data.data;
    return [];
};

export const createIntentMutation = async (data: IntentCreate): Promise<Intent> => {
    const response = await authorizedAxios(URL_BASE).post("", data);
    return response.data.data;
};

export const updateIntentMutation = async ({
    id,
    data,
}: {
    id: number;
    data: IntentUpdate;
}): Promise<Intent> => {
    const response = await authorizedAxios(`${URL_BASE}/${id}`).patch("", data);
    return response.data.data;
};

export const deleteIntentMutation = async (id: number): Promise<void> => {
    await authorizedAxios(`${URL_BASE}/${id}`).delete("");
};

// Patterns
export const createPatternMutation = async ({
    intentId,
    data,
}: {
    intentId: number;
    data: PatternCreate;
}) => {
    const response = await authorizedAxios(`${URL_BASE}/${intentId}/patterns`).post("", data);
    return response.data.data;
};

export const updatePatternMutation = async ({
    patternId,
    data,
}: {
    patternId: number;
    data: PatternUpdate;
}) => {
    const response = await authorizedAxios(`${URL_BASE}/patterns/${patternId}`).patch("", data);
    return response.data.data;
};

export const deletePatternMutation = async (patternId: number): Promise<void> => {
    await authorizedAxios(`${URL_BASE}/patterns/${patternId}`).delete("");
};

// Responses
export const createResponseMutation = async ({
    intentId,
    data,
}: {
    intentId: number;
    data: ResponseCreate;
}) => {
    const response = await authorizedAxios(`${URL_BASE}/${intentId}/responses`).post("", data);
    return response.data.data;
};

export const updateResponseMutation = async ({
    responseId,
    data,
}: {
    responseId: number;
    data: ResponseUpdate;
}) => {
    const response = await authorizedAxios(`${URL_BASE}/responses/${responseId}`).patch("", data);
    return response.data.data;
};

export const deleteResponseMutation = async (responseId: number): Promise<void> => {
    await authorizedAxios(`${URL_BASE}/responses/${responseId}`).delete("");
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
//
// Query key ["intents"] is the single source of truth for the whole list.
// Every mutation invalidates it so the UI always reflects server state.
// We don't manually update local state after mutations — we let the query
// refetch. This keeps local and server state perfectly in sync.
// Research: "TanStack Query invalidateQueries vs setQueryData" if you want
// optimistic updates later (faster UI, more complex code).

export const useGetIntents = () =>
    useQuery({
        queryKey: ["intents"],
        queryFn: getIntentsQuery,
    });

export const useCreateIntent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createIntentMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};

export const useUpdateIntent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateIntentMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};

export const useDeleteIntent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteIntentMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};

// Patterns — invalidate the same ["intents"] key because patterns are
// embedded in the intent objects that GET /intents returns.

export const useCreatePattern = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPatternMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};

export const useUpdatePattern = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updatePatternMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};

export const useDeletePattern = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deletePatternMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};

// Responses

export const useCreateResponse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResponseMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};

export const useUpdateResponse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateResponseMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};

export const useDeleteResponse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResponseMutation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["intents"] });
        },
    });
};