import { apiClient } from "../../../shared/api/apiClient";
import type {
  ChatbotAnalytics,
  ChatFeedback,
  ChatMessageInput,
  ChatReply,
  ChatTestResult,
  Conversation,
  ChatbotResponse,
  FeedbackReview,
  ImportSummary,
  Intent,
  IntentExport,
  IntentImport,
  IntentInput,
  Pattern,
  PatternInput,
  PatternOverlap,
  ResponseInput,
  TrainingRecord,
  UnknownMessage,
} from "../chatbotTypes";

const CHAT_TIMEOUT_MS = 20000;
const IMPORT_TIMEOUT_MS = 30000;

const fieldErrors = { handlesFieldErrors: true };

export const sendChatMessage = (data: ChatMessageInput): Promise<ChatReply> =>
  apiClient.post<ChatReply>("/chatbot/messages", data, { timeout: CHAT_TIMEOUT_MS });

export const getLatestConversation = (): Promise<Conversation | null> => apiClient.get<Conversation | null>("/chatbot/conversations/latest");

export const deleteConversation = (id: number): Promise<void> => apiClient.delete(`/chatbot/conversations/${id}`);

export const listIntents = (): Promise<Intent[]> => apiClient.list<Intent>("/chatbot/intents");

export const createIntent = (data: IntentInput): Promise<Intent> =>
  apiClient.post<Intent>("/chatbot/intents", data, fieldErrors);

export const updateIntent = (id: number, data: IntentInput): Promise<Intent> =>
  apiClient.put<Intent>(`/chatbot/intents/${id}`, data, fieldErrors);

export const deleteIntent = (id: number): Promise<void> => apiClient.delete(`/chatbot/intents/${id}`);

export const createPattern = (intentId: number, data: PatternInput): Promise<Pattern> =>
  apiClient.post<Pattern>(`/chatbot/intents/${intentId}/patterns`, data, fieldErrors);

export const updatePattern = (id: number, data: PatternInput): Promise<Pattern> =>
  apiClient.put<Pattern>(`/chatbot/patterns/${id}`, data, fieldErrors);

export const deletePattern = (id: number): Promise<void> => apiClient.delete(`/chatbot/patterns/${id}`);

export const createResponse = (intentId: number, data: ResponseInput): Promise<ChatbotResponse> =>
  apiClient.post<ChatbotResponse>(`/chatbot/intents/${intentId}/responses`, data, fieldErrors);

export const updateResponse = (id: number, data: ResponseInput): Promise<ChatbotResponse> =>
  apiClient.put<ChatbotResponse>(`/chatbot/responses/${id}`, data, fieldErrors);

export const deleteResponse = (id: number): Promise<void> => apiClient.delete(`/chatbot/responses/${id}`);

export const listUnknownMessages = (): Promise<UnknownMessage[]> =>
  apiClient.list<UnknownMessage>("/chatbot/unknown-messages");

export const deleteUnknownMessage = (id: number): Promise<void> => apiClient.delete(`/chatbot/unknown-messages/${id}`);

export const promoteUnknownMessage = (id: number, intentId: number): Promise<Pattern> =>
  apiClient.post<Pattern>(`/chatbot/unknown-messages/${id}/promote`, { intent_id: intentId });

export const listTrainings = (): Promise<TrainingRecord[]> =>
  apiClient.list<TrainingRecord>("/chatbot/trainings");

export const setFeedback = (messageId: number, feedback: ChatFeedback | null): Promise<void> =>
  apiClient.put(`/chatbot/messages/${messageId}/feedback`, { feedback });

export const testMessage = (message: string): Promise<ChatTestResult> =>
  apiClient.post<ChatTestResult>("/chatbot/test", { message }, { timeout: CHAT_TIMEOUT_MS, ...fieldErrors });

export const listFeedbackReviews = (): Promise<FeedbackReview[]> => apiClient.list<FeedbackReview>("/chatbot/feedback");

export const promoteFeedback = (id: number, intentId: number): Promise<Pattern> =>
  apiClient.post<Pattern>(`/chatbot/feedback/${id}/promote`, { intent_id: intentId });

export const dismissFeedback = (id: number): Promise<void> => apiClient.post(`/chatbot/feedback/${id}/dismiss`);

export const getAnalytics = (weeks: number): Promise<ChatbotAnalytics> =>
  apiClient.get<ChatbotAnalytics>("/chatbot/analytics", { params: { weeks } });

export const listIntentOverlaps = (intentId: number): Promise<PatternOverlap[]> =>
  apiClient.list<PatternOverlap>(`/chatbot/intents/${intentId}/overlaps`, { timeout: CHAT_TIMEOUT_MS });

export const exportIntents = (): Promise<IntentExport[]> => apiClient.list<IntentExport>("/chatbot/intents/export");

export const importIntents = (data: IntentImport): Promise<ImportSummary> =>
  apiClient.post<ImportSummary>("/chatbot/intents/import", data, { timeout: IMPORT_TIMEOUT_MS });
