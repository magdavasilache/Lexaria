import { KeyboardEvent, MouseEvent, ReactNode, Ref, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, X } from "lucide-react";
import Button from "../../global-components/buttons/Button";
import { FieldStatus } from "../useFieldStatus";
import FieldShell from "./FieldShell";
import { FieldErrorLike, resolveStatus, useFieldIds } from "./fieldStyles";

type RatingFieldProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  max?: number;
  step?: number;
  required?: boolean;
  helperText?: ReactNode;
  error?: FieldErrorLike;
  status?: FieldStatus;
  ref?: Ref<HTMLDivElement>;
};

const STAR_TONE: Record<FieldStatus, string> = {
  invalid: "text-errorLight dark:text-errorDark",
  valid: "text-ratingLight dark:text-ratingDark",
  neutral: "text-ratingLight dark:text-ratingDark",
};

export function StarsDisplay({ value, max = 5, className = "h-4 w-4" }: { value: number; max?: number; className?: string }) {
  return (
    <span className="inline-flex gap-0.5 text-ratingLight dark:text-ratingDark" aria-hidden="true">
      {Array.from({ length: max }, (_, index) => {
        const fill = Math.min(Math.max(value - index, 0), 1);
        return (
          <span key={index} className={`relative ${className}`}>
            <Star className={`absolute inset-0 ${className}`} strokeWidth={1.5} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={className} fill="currentColor" strokeWidth={1.5} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function RatingField({ label, value, onChange, onBlur, max = 5, step = 0.5, required, helperText, error, status = "neutral", ref }: RatingFieldProps) {
  const { t, i18n } = useTranslation();
  const ids = useFieldIds(undefined, Boolean(helperText), error);
  const visualStatus = resolveStatus(error, status);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const format = (rating: number) => new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 1 }).format(rating);
  const clamp = (rating: number) => Math.min(max, Math.max(step, rating));

  const pick = (event: MouseEvent<HTMLSpanElement>, index: number) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    return index + (event.clientX - left < width / 2 ? step : 1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = value ?? 0;
    const moves: Record<string, () => number | null> = {
      ArrowRight: () => clamp(current + step),
      ArrowUp: () => clamp(current + step),
      ArrowLeft: () => clamp(current - step),
      ArrowDown: () => clamp(current - step),
      Home: () => step,
      End: () => max,
      Delete: () => null,
      Backspace: () => null,
    };
    if (event.key in moves) {
      event.preventDefault();
      onChange(moves[event.key]());
    }
  };

  return (
    <FieldShell label={label} required={required} helperText={helperText} error={error} {...ids}>
      <div className={`flex flex-wrap items-center gap-2 ${error?.message ? "animate-shake" : ""}`}>
        <div
          id={ids.inputId}
          ref={ref}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={step}
          aria-valuemax={max}
          aria-valuenow={value ?? undefined}
          aria-valuetext={value === null ? t("fields.noRating") : t("fields.ratingValue", { value: format(value), max })}
          aria-required={required || undefined}
          aria-invalid={error?.message ? true : undefined}
          aria-describedby={ids.describedBy}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onMouseLeave={() => setHover(null)}
          className={`flex cursor-pointer gap-1 rounded-control p-1 outline-none focus-visible:shadow-focusLight dark:focus-visible:shadow-focusDark ${STAR_TONE[visualStatus]}`}
        >
          {Array.from({ length: max }, (_, index) => {
            const fill = Math.min(Math.max(shown - index, 0), 1);
            return (
              <span
                key={index}
                className="relative h-8 w-8"
                onMouseMove={(event) => setHover(pick(event, index))}
                onClick={(event) => onChange(pick(event, index))}
              >
                <Star className="absolute inset-0 h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
                {fill > 0 && (
                  <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                    <Star className="h-8 w-8" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                )}
              </span>
            );
          })}
        </div>
        <span className="min-w-10 text-sm tabular-nums text-fontMutedLight dark:text-fontMutedDark" aria-hidden="true">
          {value === null ? "–" : format(value)}
        </span>
        {value !== null && (
          <Button variant="ghost" size="sm" leftIcon={X} onClick={() => onChange(null)} className="min-h-10">
            {t("fields.clearRating")}
          </Button>
        )}
      </div>
    </FieldShell>
  );
}
