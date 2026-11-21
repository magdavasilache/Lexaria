import { ReactNode, Ref, useId } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowRight, Hourglass } from "lucide-react";
import { FieldStatus } from "../useFieldStatus";
import FieldShell from "./FieldShell";
import { CalendarBadge, DATE_INPUT_CLASS } from "./DateField";
import { FieldErrorLike, controlClass, resolveStatus } from "./fieldStyles";

export type DateRange = { from: string; to: string };

type DateRangeFieldProps = {
  label: string;
  hideLabel?: boolean;
  error?: FieldErrorLike & { from?: FieldErrorLike; to?: FieldErrorLike };
  helperText?: ReactNode;
  status?: FieldStatus;
  value: DateRange | null | undefined;
  onChange: (value: DateRange) => void;
  onBlur?: () => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  showDuration?: boolean;
  ref?: Ref<HTMLInputElement>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const daysBetween = ({ from, to }: DateRange) => {
  if (!from || !to) return null;
  const diff = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
  return Number.isNaN(diff) || diff < 0 ? null : diff + 1;
};

export default function DateRangeField({ label, hideLabel, error, helperText, status = "neutral", value, onChange, onBlur, min, max, required, disabled, showDuration = true, ref }: DateRangeFieldProps) {
  const { t } = useTranslation();
  const baseId = useId();
  const fromId = `${baseId}-from`;
  const toId = `${baseId}-to`;
  const helperId = `${baseId}-helper`;
  const errorId = `${baseId}-error`;
  const range = value ?? { from: "", to: "" };
  const message = error?.message ?? error?.from?.message ?? error?.to?.message;
  const shownError = message ? { message } : undefined;
  const visualStatus = resolveStatus(shownError, status);
  const describedBy = [helperText ? helperId : null, message ? errorId : null].filter(Boolean).join(" ") || undefined;
  const days = daysBetween(range);

  const part = (key: keyof DateRange, id: string, partLabel: string) => {
    const partStatus: FieldStatus = error?.[key]?.message ? "invalid" : visualStatus;
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <label htmlFor={id} className="text-xs uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
          {partLabel}
        </label>
        <div className="group/date relative">
          <input
            id={id}
            ref={key === "from" ? ref : undefined}
            type="date"
            disabled={disabled}
            value={range[key]}
            min={key === "to" ? range.from || min : min}
            max={key === "from" ? range.to || max : max}
            onChange={(event) => onChange({ ...range, [key]: event.target.value })}
            onBlur={onBlur}
            aria-required={required || undefined}
            aria-invalid={message ? true : undefined}
            aria-describedby={describedBy}
            className={controlClass(partStatus, DATE_INPUT_CLASS)}
          />
          <CalendarBadge status={partStatus} />
        </div>
      </div>
    );
  };

  return (
    <FieldShell as="fieldset" label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={shownError} inputId={fromId} helperId={helperId} errorId={errorId}>
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-end ${message ? "animate-shake" : ""}`}>
        {part("from", fromId, t("fields.dateFrom"))}
        <span className="flex h-6 items-center justify-center self-center text-secondaryActiveLight dark:text-primaryDark sm:h-10 sm:self-end" aria-hidden="true">
          <ArrowDown className="h-4 w-4 sm:hidden" />
          <ArrowRight className="hidden h-4 w-4 sm:block" />
        </span>
        {part("to", toId, t("fields.dateTo"))}
      </div>
      {showDuration && days !== null && (
        <p className="inline-flex items-center gap-1.5 self-start rounded-control border border-gold-300 bg-gold-50 px-2 py-0.5 text-xs font-medium text-gold-900 animate-scale-in dark:border-panelBorderDark dark:bg-panelDark dark:text-gold-300" aria-live="polite">
          <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
          {t("fields.dateSpan", { count: days })}
        </p>
      )}
    </FieldShell>
  );
}
