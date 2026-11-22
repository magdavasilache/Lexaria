import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIntent,
  createPattern,
  createResponse,
  deleteConversation,
  deleteIntent,
  deletePattern,
  deleteResponse,
  deleteUnknownMessage,
  dismissFeedback,
  exportIntents,
  getAnalytics,
  getLatestConversation,
  importIntents,
  listFeedbackReviews,
  listIntentOverlaps,
  listIntents,
  listTrainings,
  listUnknownMessages,
  promoteFeedback,
  promoteUnknownMessage,
  sendChatMessage,
  setFeedback,
  testMessage,
  updateIntent,
  updatePattern,
  updateResponse,
} from "../api/chatbotAPI";
import type { ChatFeedback, IntentInput, PatternInput, ResponseInput } from "../chatbotTypes";
import { chatbotKeys } from "./chatbotKeys";

const useInvalidate = (...keys: (readonly unknown[])[]) => {
  const queryClient = useQueryClient();
  return () => keys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
};

export const useSendChatMessage = () => useMutation({ mutationFn: sendChatMessage });

export const useLatestConversation = () =>
  useQuery({ queryKey: chatbotKeys.latestConversation(), queryFn: getLatestConversation, staleTime: 0, refetchOnWindowFocus: false });

export const useDeleteConversation = () =>
  useMutation({ mutationFn: deleteConversation, onSuccess: useInvalidate(chatbotKeys.latestConversation()) });

export const useIntents = () => useQuery({ queryKey: chatbotKeys.intents(), queryFn: listIntents });

export const useUnknownMessages = () => useQuery({ queryKey: chatbotKeys.unknownMessages(), queryFn: listUnknownMessages });

export const useTrainings = () => useQuery({ queryKey: chatbotKeys.trainings(), queryFn: listTrainings });

export const useSaveIntent = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: IntentInput }) => (id === null ? createIntent(data) : updateIntent(id, data)),
    onSuccess: useInvalidate(chatbotKeys.intents()),
  });

export const useDeleteIntent = () => useMutation({ mutationFn: deleteIntent, onSuccess: useInvalidate(chatbotKeys.intents()) });

export const useCreatePattern = () =>
  useMutation({
    mutationFn: ({ intentId, data }: { intentId: number; data: PatternInput }) => createPattern(intentId, data),
    onSuccess: useInvalidate(chatbotKeys.intents()),
  });

export const useUpdatePattern = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: number; data: PatternInput }) => updatePattern(id, data),
    onSuccess: useInvalidate(chatbotKeys.intents()),
  });

export const useDeletePattern = () => useMutation({ mutationFn: deletePattern, onSuccess: useInvalidate(chatbotKeys.intents()) });

export const useSaveResponse = () =>
  useMutation({
    mutationFn: ({ id, intentId, data }: { id: number | null; intentId: number; data: ResponseInput }) =>
      id === null ? createResponse(intentId, data) : updateResponse(id, data),
    onSuccess: useInvalidate(chatbotKeys.intents()),
  });

export const useDeleteResponse = () => useMutation({ mutationFn: deleteResponse, onSuccess: useInvalidate(chatbotKeys.intents()) });

export const useDeleteUnknownMessage = () =>
  useMutation({ mutationFn: deleteUnknownMessage, onSuccess: useInvalidate(chatbotKeys.unknownMessages()) });

export const usePromoteUnknownMessage = () =>
  useMutation({
    mutationFn: ({ id, intentId }: { id: number; intentId: number }) => promoteUnknownMessage(id, intentId),
    onSuccess: useInvalidate(chatbotKeys.unknownMessages(), chatbotKeys.intents()),
  });

export const useSetFeedback = () =>
  useMutation({
    mutationFn: ({ messageId, feedback }: { messageId: number; feedback: ChatFeedback | null }) => setFeedback(messageId, feedback),
    onSuccess: useInvalidate(chatbotKeys.latestConversation(), chatbotKeys.feedback()),
  });

export const useTestMessage = () => useMutation({ mutationFn: testMessage });

export const useFeedbackReviews = () => useQuery({ queryKey: chatbotKeys.feedback(), queryFn: listFeedbackReviews });

export const usePromoteFeedback = () =>
  useMutation({
    mutationFn: ({ id, intentId }: { id: number; intentId: number }) => promoteFeedback(id, intentId),
    onSuccess: useInvalidate(chatbotKeys.feedback(), chatbotKeys.intents()),
  });

export const useDismissFeedback = () => useMutation({ mutationFn: dismissFeedback, onSuccess: useInvalidate(chatbotKeys.feedback()) });

export const useChatbotAnalytics = (weeks: number) =>
  useQuery({ queryKey: chatbotKeys.analytics(weeks), queryFn: () => getAnalytics(weeks) });

export const useIntentOverlaps = (intentId: number | null) =>
  useQuery({
    queryKey: chatbotKeys.overlaps(intentId ?? 0),
    queryFn: () => listIntentOverlaps(intentId ?? 0),
    enabled: intentId !== null,
  });

export const useExportIntents = () => useMutation({ mutationFn: exportIntents });

export const useImportIntents = () =>
  useMutation({ mutationFn: importIntents, onSuccess: useInvalidate(chatbotKeys.intents()) });
