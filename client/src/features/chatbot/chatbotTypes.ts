import type { Schema } from "../../shared/api/apiTypes";

export type Intent = Schema<"IntentOut">;
export type IntentInput = Schema<"IntentIn">;
export type Pattern = Schema<"PatternOut">;
export type PatternInput = Schema<"PatternIn">;
export type ChatbotResponse = Schema<"ResponseOut">;
export type ResponseInput = Schema<"ResponseIn">;
export type ResponseLanguage = Schema<"ResponseLanguage">;
export type UnknownMessage = Schema<"UnknownMessageOut">;
export type TrainingRecord = Schema<"TrainingOut">;
export type ChatMessageInput = Schema<"ChatMessageIn">;
export type ChatReply = Schema<"ChatReplyOut">;
export type ReplyLine = Schema<"ReplyLineOut">;
export type ChatBook = Schema<"ChatBookOut">;
export type ChatAction = Schema<"ChatActionOut">;
export type Conversation = Schema<"ConversationOut">;
export type ChatHistoryMessage = Schema<"ChatHistoryMessageOut">;
export type ChatFeedback = Schema<"ChatFeedback">;
export type ChatTestResult = Schema<"ChatTestOut">;
export type FeedbackReview = Schema<"FeedbackReviewOut">;
export type ChatbotAnalytics = Schema<"ChatbotAnalyticsOut">;
export type AnalyticsWeek = Schema<"AnalyticsWeekOut">;
export type PatternOverlap = Schema<"PatternOverlapOut">;
export type IntentExport = Schema<"IntentExportOut">;
export type IntentImport = Schema<"IntentImportIn">;
export type ImportSummary = Schema<"SeedSummary">;

export type TrainingEvent =
  | Schema<"TrainingStartedEvent">
  | Schema<"TrainingProgressEvent">
  | Schema<"TrainingDoneEvent">
  | Schema<"TrainingErrorEvent">;

export type ChatbotSubTab = "intents" | "responses" | "test" | "training" | "history" | "analytics";

export type TrainingStatus = "idle" | "running" | "done" | "error";

export type ChatMessage =
  | { id: number; role: "user"; text: string; timestamp: Date }
  | {
      id: number;
      role: "bot";
      messageId: number | null;
      lines: ReplyLine[];
      books: ChatBook[];
      intent: string | null;
      confidence: number | null;
      feedback: ChatFeedback | null;
      timestamp: Date;
    };
