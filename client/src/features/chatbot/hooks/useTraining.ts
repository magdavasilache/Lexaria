import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { type ApiResponse, hintOf, messageOf } from "../../../shared/api/apiTypes";
import { currentLanguage } from "../../../i18n";
import type { Message } from "../../../i18n/message";
import type { TrainingEvent, TrainingStatus } from "../chatbotTypes";
import { API_URL } from "../../../shared/utils/constants";
import { useAuthStore } from "../../auth/stores/useAuthStore";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";
import { chatbotKeys } from "./chatbotKeys";

export const LOG_LEVELS = ["success", "error", "info", "log"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
export type TrainingLog = { level: LogLevel; message: Message };

const EVENT_PREFIX = "data: ";
const LOG = "front/admin:chatbot.training.log";

export type UseTrainingReturn = {
  status: TrainingStatus;
  logs: TrainingLog[];
  progress: number;
  startTraining: () => Promise<void>;
  reset: () => void;
};

const ENCODE_SHARE = 80;

const percent = (value: number) => Math.round(value * 100);

const stageProgress = (stage: "encode" | "evaluate", done: number, total: number) =>
  stage === "encode" ? Math.round((done / total) * ENCODE_SHARE) : ENCODE_SHARE + Math.round((done / total) * (99 - ENCODE_SHARE));

const toLogs = (event: TrainingEvent): TrainingLog[] => {
  switch (event.type) {
    case "started":
      return [{ level: "info", message: { key: `${LOG}.started`, params: { intents: event.intents, samples: event.samples, model: event.model } } }];
    case "progress":
      return event.done === event.total ? [{ level: "log", message: { key: `${LOG}.${event.stage}` } }] : [];
    case "done":
      return [
        { level: "success", message: { key: `${LOG}.done`, params: { accuracy: percent(event.training.accuracy ?? 0), intents: event.training.intents ?? 0 } } },
        ...(event.training.confused_pairs ?? []).map((pair): TrainingLog => ({
          level: "info",
          message: { key: `${LOG}.confused`, params: { expected: pair.expected, predicted: pair.predicted, count: pair.count } },
        })),
      ];
    case "error":
      return [{ level: "error", message: messageOf({ key: event.error.key, params: event.error.params ?? {} }) }];
  }
};

export function useTraining(): UseTrainingReturn {
  const [status, setStatus] = useState<TrainingStatus>("idle");
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [progress, setProgress] = useState(0);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const queryClient = useQueryClient();
  const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

  const reset = () => {
    readerRef.current?.cancel();
    readerRef.current = null;
    setStatus("idle");
    setLogs([]);
    setProgress(0);
  };

  const fail = (message: Message, hint: Message | null = null) => {
    setStatus("error");
    setLogs((previous) => [...previous, { level: "error", message }]);
    showSnackBar(message, "error", 4000, hint);
  };

  const handle = (event: TrainingEvent) => {
    setLogs((previous) => [...previous, ...toLogs(event)]);
    if (event.type === "progress") setProgress(stageProgress(event.stage, event.done, event.total));
    if (event.type === "done") {
      setProgress(100);
      setStatus("done");
    }
    if (event.type === "error") setStatus("error");
    if (event.type === "done" || event.type === "error") queryClient.invalidateQueries({ queryKey: chatbotKeys.trainings() });
  };

  const startTraining = async () => {
    setStatus("running");
    setLogs([]);
    setProgress(0);
    const token = await useAuthStore.getState().getFreshAccessToken();

    let response: Response;
    try {
      response = await fetch(`${API_URL}chatbot/trainings`, {
        method: "POST",
        headers: {
          "Accept-Language": currentLanguage(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      fail({ key: "front/common:network.offline" });
      return;
    }

    if (!response.ok || !response.body) {
      const body = (await response.json().catch(() => null)) as ApiResponse<null> | null;
      const error = body?.errors?.[0];
      if (error) fail(messageOf(error), hintOf(error));
      else fail({ key: "front/common:status.unexpected" });
      queryClient.invalidateQueries({ queryKey: chatbotKeys.trainings() });
      return;
    }

    const reader = response.body.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          if (chunk.startsWith(EVENT_PREFIX)) handle(JSON.parse(chunk.slice(EVENT_PREFIX.length)) as TrainingEvent);
        }
      }
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") fail({ key: `${LOG}.interrupted` });
    } finally {
      readerRef.current = null;
    }
  };

  return { status, logs, progress, startTraining, reset };
}
