export const INTENT_TYPES = ["informational", "action", "fallback"] as const;

export const RESPONSE_LANGUAGES = ["en", "ro"] as const;

export const IMPORT_MODES = ["merge", "replace"] as const;

export const CHATBOT_RULES = {
  tagMaxLength: 50,
  tagPattern: /^[a-z][a-z0-9_]*$/,
  patternMaxLength: 200,
  responseMaxLength: 1000,
  messageMaxLength: 500,
  importFileMaxMb: 2,
  importFileExtension: ".json",
  importFileTypes: ["application/json", ""],
} as const;

export const normalizeTag = (value: string) => value.trim().toLowerCase().split(/\s+/).join("_");
