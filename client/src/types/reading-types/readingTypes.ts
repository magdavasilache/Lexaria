import type { Schema } from "../../api/apiTypes";

export type ReadingState = Schema<"ReadingState">;
export type ReadingEventType = Schema<"ReadingEventType">;

export type Reading = Schema<"ReadingOut">;
export type ReadingSession = Schema<"SessionOut">;
export type ActiveSession = Schema<"ActiveSessionOut">;
export type ReadingEvent = Schema<"ReadingEventOut">;

export type JourneyEntry = Schema<"JourneyEventEntry"> | Schema<"JourneySessionEntry">;
export type JourneyReading = Schema<"JourneyReading">;
export type Journey = Schema<"JourneyOut">;

export type ReadingGoal = Schema<"ReadingGoalOut">;
export type ReadingToday = Schema<"ReadingTodayOut">;

export type SessionStartPayload = Schema<"SessionStart">;
export type SessionEndPayload = Schema<"SessionEnd">;
export type NotePayload = Schema<"NoteCreate">;
export type NoteUpdatePayload = Schema<"NoteUpdate">;
export type ReadingUpdatePayload = Schema<"ReadingUpdate">;
export type ReadingGoalPayload = Schema<"ReadingGoalSet">;
