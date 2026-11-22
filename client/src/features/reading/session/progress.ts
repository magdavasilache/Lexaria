import { READING_RULES } from "../schemas/readingRules";
import type { ProgressBounds } from "../schemas/readingSchemas";
import type { ActiveSession } from "../types/readingTypes";

export const usesPercent = (session: ActiveSession) => {
  const edition = session.reading.edition;
  return edition ? !edition.tracks_pages : session.start_percent !== null;
};

export const progressBounds = (session: ActiveSession, fromStart: boolean): ProgressBounds => {
  const percent = usesPercent(session);
  const start = percent ? session.start_percent : session.start_page;
  return {
    usesPercent: percent,
    min: fromStart ? start ?? 0 : 0,
    max: percent ? READING_RULES.percentMax : session.reading.edition?.pages ?? READING_RULES.pagesMax,
  };
};

export const lastProgress = (session: ActiveSession) =>
  usesPercent(session)
    ? session.start_percent ?? session.reading.current_percent
    : session.start_page ?? session.reading.current_page;
