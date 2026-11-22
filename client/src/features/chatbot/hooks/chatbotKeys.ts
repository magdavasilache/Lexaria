export const chatbotKeys = {
  all: ["chatbot"] as const,
  latestConversation: () => [...chatbotKeys.all, "conversations", "latest"] as const,
  intents: () => [...chatbotKeys.all, "intents"] as const,
  overlaps: (intentId: number) => [...chatbotKeys.intents(), intentId, "overlaps"] as const,
  feedback: () => [...chatbotKeys.all, "feedback"] as const,
  analytics: (weeks: number) => [...chatbotKeys.all, "analytics", weeks] as const,
  unknownMessages: () => [...chatbotKeys.all, "unknown-messages"] as const,
  trainings: () => [...chatbotKeys.all, "trainings"] as const,
};
