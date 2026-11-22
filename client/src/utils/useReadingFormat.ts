import { useTranslation } from "react-i18next";
import type { Edition } from "../types/reading-types/editionTypes";
import type { Reading } from "../types/reading-types/readingTypes";

type DurationFormatter = { format: (duration: Record<string, number>) => string };
type DurationFormatConstructor = new (locale: string, options: { style: "short" }) => DurationFormatter;

const durationFormat = (Intl as unknown as { DurationFormat?: DurationFormatConstructor }).DurationFormat;

export const useReadingFormat = () => {
  const { t, i18n } = useTranslation("front/reading");
  const language = i18n.resolvedLanguage ?? "en";

  const percent = (value: number) => new Intl.NumberFormat(language, { style: "percent", maximumFractionDigits: 1 }).format(value / 100);

  const date = (iso: string) => new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(new Date(iso));

  const dateTime = (iso: string) => new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  const duration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours === 0 && minutes === 0) return t("duration.underMinute");
    if (durationFormat) {
      return new durationFormat(language, { style: "short" }).format(hours > 0 ? { hours, minutes } : { minutes });
    }
    return hours > 0 ? t("duration.hoursMinutes", { hours, minutes }) : t("duration.minutes", { minutes });
  };

  const editionTitle = (edition: Edition) => [t(`formats.${edition.format}`), edition.language_name].filter(Boolean).join(" · ");

  const editionDetails = (edition: Edition) =>
    [
      edition.translator ? t("edition.translatedBy", { translator: edition.translator }) : null,
      edition.publisher,
      edition.pages ? t("edition.pages", { count: edition.pages }) : null,
      edition.published_at ? new Intl.DateTimeFormat(language, { year: "numeric" }).format(new Date(edition.published_at)) : null,
    ]
      .filter(Boolean)
      .join(" · ");

  const progress = (reading: Reading) => {
    const parts = [];
    if (reading.current_page !== null) {
      parts.push(
        reading.edition?.pages
          ? t("progress.pageOf", { page: reading.current_page, total: reading.edition.pages })
          : t("progress.page", { page: reading.current_page })
      );
    }
    if (reading.progress_percent !== null) parts.push(percent(reading.progress_percent));
    return parts.join(" · ");
  };

  return { language, percent, date, dateTime, duration, editionTitle, editionDetails, progress };
};
