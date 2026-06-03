export type Intent = {
    id: number;
    tag: string;
    type: 'informational' | 'action' | 'fallback';
    patterns: { id: number; pattern: string }[];
    responses: { id: number; response: string }[];
};

export type TrainingRecord = {
    id: number;
    epochs: number;
    success: boolean;
    created_at: string;
};

export type UnknownMessage = {
    id: number;
    message: string;
    confidence: number;
    created_at: string;
};

export type ChatbotSubTab = "intents" | "responses" | "training" | "history";

// types/chatbot-types.ts
// Add these to your existing chatbot-types file (or create it if it doesn't exist yet).

// ─── Core domain types (mirror the backend schemas) ───────────────────────────

export type Pattern = {
    id: number;
    pattern: string;
};

export type BotResponse = {
    id: number;
    response: string;
};

export type IntentCreate = {
    tag: string;
    type: "informational" | "action" | "fallback";
};

export type IntentUpdate = {
    tag?: string;
    type?: "informational" | "action" | "fallback";
};

export type PatternCreate = {
    pattern: string;
};

export type PatternUpdate = {
    pattern: string;
};

export type ResponseCreate = {
    response: string;
};

export type ResponseUpdate = {
    response: string;
};

// ─── Chat message types (for the ChatWindow component) ────────────────────────

export type ChatRole = "user" | "bot";

export type ChatMessage = {
    id: number;
    role: ChatRole;
    text: string;
    intent?: string;
    confidence?: number;
    timestamp: Date;
};

export type ChatApiResponse = {
    response: string;
    intent: string | null;
    confidence: number;
    fallback: boolean;
    conversation_id: number;
};


export type TrainingStatus = "idle" | "running" | "done" | "error";

