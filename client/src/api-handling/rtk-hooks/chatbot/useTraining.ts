import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authorizedAxios } from "../../../api/authorizedAxios";
import { TrainingRecord, TrainingStatus } from "../../../types/chatbot-types";
import { useAuthStore } from "../../context/authentication/useAuthStore";
import { API_URL } from "../../../utils/constants";

const ML_BASE = `${API_URL}ml`;
const CHATBOT_BASE = "ml-inference/";

export const getTrainingHistoryQuery = async (): Promise<TrainingRecord[]> => {
    const response = await authorizedAxios(`${CHATBOT_BASE}/trainings`).get("");
    if (response.status === 200) return response.data.data;
    return [];
};

export const useGetTrainingHistory = () =>
    useQuery({
        queryKey: ["training-history"],
        queryFn: getTrainingHistoryQuery,
    });


const reloadModel = async (): Promise<void> => {
    await authorizedAxios(`${CHATBOT_BASE}reload`).post("");
};


export type UseTrainingReturn = {
    status: TrainingStatus;
    logs: string[];
    progress: number;
    startTraining: (epochs: number) => Promise<void>;
    reset: () => void;
};

export function useTraining(): UseTrainingReturn {
    const [status, setStatus] = useState<TrainingStatus>("idle");
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
    const queryClient = useQueryClient();

    const reset = useCallback(() => {
        readerRef.current?.cancel();
        readerRef.current = null;
        setStatus("idle");
        setLogs([]);
        setProgress(0);
    }, []);

    const startTraining = useCallback(async (epochs: number) => {
        setStatus("running");
        setLogs([]);
        setProgress(0);
        const token = useAuthStore.getState().accessToken

        let response: Response;
        try {
            response = await fetch(`${ML_BASE}/train?epochs=${epochs}`, {
                method: "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
        } catch {
            setStatus("error");
            setLogs(prev => [...prev, "[ERROR] Could not connect to the server."]);
            return;
        }

        if (!response.ok) {
            setStatus("error");
            setLogs(prev => [...prev, `[ERROR] Server responded with ${response.status}.`]);
            return;
        }

        if (!response.body) {
            setStatus("error");
            setLogs(prev => [...prev, "[ERROR] No stream body in response."]);
            return;
        }

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();
        let buffer = "";
        let logLineCount = 0;

        const EXPECTED_LINES = 23;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const parts = buffer.split("\n\n");
                buffer = parts.pop() ?? ""; 

                for (const part of parts) {
                    if (!part.startsWith("data: ")) continue;
                    const msg = part.slice(6); // strip "data: "

                    if (msg === "__DONE__") {
                        setProgress(100);
                        setStatus("done");
                        try {
                            await reloadModel();
                            setLogs(prev => [...prev, "[✓] Model reloaded on server."]);
                        } catch {
                            setLogs(prev => [...prev, "[WARN] Model saved but reload failed. Restart the server."]);
                        }

                        queryClient.invalidateQueries({ queryKey: ["training-history"] });
                        return;
                    }

                    if (msg.startsWith("[ERROR]")) {
                        setStatus("error");
                        setLogs(prev => [...prev, msg]);
                        return;
                    }

                    setLogs(prev => [...prev, msg]);
                    logLineCount++;
                    setProgress(Math.min(95, Math.round((logLineCount / EXPECTED_LINES) * 100)));
                }
            }
        } catch (err) {
            if ((err as Error)?.name !== "AbortError") {
                setStatus("error");
                setLogs(prev => [...prev, "[ERROR] Stream interrupted unexpectedly."]);
            }
        }
    }, [queryClient]);

    return { status, logs, progress, startTraining, reset };
}