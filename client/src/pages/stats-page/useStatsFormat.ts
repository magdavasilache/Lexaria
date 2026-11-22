import { useTranslation } from "react-i18next";
import type { ChallengeMetric } from "../../types/stats-types/statsTypes";
import { useReadingFormat } from "../../utils/useReadingFormat";

const COMPACT_FROM = 10_000;

export const parseDay = (day: string) => {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
};

export const useStatsFormat = () => {
  const { t } = useTranslation("front/stats");
  const { language, duration } = useReadingFormat();

  const number = (value: number, maximumFractionDigits = 0) =>
    new Intl.NumberFormat(language, {
      notation: Math.abs(value) >= COMPACT_FROM ? "compact" : "standard",
      maximumFractionDigits: Math.abs(value) >= COMPACT_FROM ? 1 : maximumFractionDigits,
    }).format(value);

  const metricDigits = (metric: ChallengeMetric) => (metric === "hours" ? 1 : 0);

  const amount = (metric: ChallengeMetric, value: number) => {
    const rounded = Number(value.toFixed(metricDigits(metric)));
    return t(`units.${metric}`, { count: rounded, value: number(rounded, metricDigits(metric)) });
  };

  const weekday = (day: string) => new Intl.DateTimeFormat(language, { weekday: "short" }).format(parseDay(day));

  const longDay = (day: string) => new Intl.DateTimeFormat(language, { weekday: "long", day: "numeric", month: "long" }).format(parseDay(day));

  return { language, number, metricDigits, amount, weekday, longDay, duration };
};
