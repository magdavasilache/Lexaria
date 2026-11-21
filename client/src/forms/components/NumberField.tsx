import { ChangeEvent, FocusEvent, InputHTMLAttributes, KeyboardEvent, ReactNode, Ref, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "lucide-react";
import Button from "../../global-components/buttons/Button";
import { FieldStatus } from "../useFieldStatus";
import FieldShell, { StatusIcon } from "./FieldShell";
import { FieldErrorLike, controlClass, resolveStatus, useFieldIds } from "./fieldStyles";

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange" | "min" | "max" | "step"> & {
  label: string;
  hideLabel?: boolean;
  error?: FieldErrorLike;
  helperText?: ReactNode;
  status?: FieldStatus;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  showStepper?: boolean;
  ref?: Ref<HTMLInputElement>;
};

const toDraft = (value: number | null | undefined) => (value === null || value === undefined || Number.isNaN(value) ? "" : String(value));

const toNumber = (draft: string): number | null => {
  if (draft === "" || draft === "-" || draft === "." || draft === "-.") return null;
  const parsed = Number(draft);
  return Number.isNaN(parsed) ? null : parsed;
};

const sanitize = (raw: string, decimals: number, allowNegative: boolean) => {
  const cleaned = raw.replace(/,/g, ".").replace(decimals > 0 ? /[^\d.-]/g : /[^\d-]/g, "");
  const negative = allowNegative && cleaned.startsWith("-");
  const unsigned = cleaned.replace(/-/g, "");
  const [integerPart, ...fractionParts] = unsigned.split(".");
  const integer = integerPart.replace(/^0+(?=\d)/, "");
  const body = fractionParts.length > 0 ? `${integer || "0"}.${fractionParts.join("").slice(0, decimals)}` : integer;
  return `${negative ? "-" : ""}${body}`;
};

const roundTo = (value: number, decimals: number) => Number(value.toFixed(decimals));

export default function NumberField({
  label, hideLabel, error, helperText, status = "neutral", value, onChange, onBlur, onFocus, onKeyDown,
  min, max, step = 1, decimals = 0, showStepper = true, required, disabled, id, className, placeholder, ref, ...inputProps
}: NumberFieldProps) {
  const { t } = useTranslation();
  const ids = useFieldIds(id, Boolean(helperText), error);
  const visualStatus = resolveStatus(error, status);
  const normalized = value ?? null;
  const [draft, setDraft] = useState(() => toDraft(normalized));
  const [syncedValue, setSyncedValue] = useState(normalized);
  const [clearedZero, setClearedZero] = useState(false);

  if (normalized !== syncedValue) {
    setSyncedValue(normalized);
    if (toNumber(draft) !== normalized) {
      setDraft(toDraft(normalized));
      setClearedZero(false);
    }
  }

  const clamp = (next: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next));

  const commit = (nextDraft: string) => {
    setDraft(nextDraft);
    setClearedZero(false);
    const next = toNumber(nextDraft);
    if (next !== normalized) onChange(next);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    commit(sanitize(event.target.value, decimals, min === undefined || min < 0));
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (normalized === 0 && draft === "0") {
      setDraft("");
      setClearedZero(true);
    }
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (clearedZero && draft === "") {
      setDraft("0");
      setClearedZero(false);
    } else {
      setDraft(toDraft(toNumber(draft)));
    }
    onBlur?.(event);
  };

  const stepBy = (direction: 1 | -1) => {
    const base = normalized ?? (direction === 1 ? (min ?? 0) - step : (max ?? 0) + step);
    const next = clamp(roundTo(base + direction * step, decimals));
    commit(toDraft(next));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      stepBy(event.key === "ArrowUp" ? 1 : -1);
    }
    onKeyDown?.(event);
  };

  const atMin = min !== undefined && normalized !== null && normalized <= min;
  const atMax = max !== undefined && normalized !== null && normalized >= max;

  const input = (
    <div className={`relative min-w-0 flex-1 ${error?.message ? "animate-shake" : ""}`}>
      <input
        id={ids.inputId}
        ref={ref}
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        autoComplete="off"
        role="spinbutton"
        aria-valuenow={normalized ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-required={required || undefined}
        aria-invalid={error?.message ? true : undefined}
        aria-describedby={ids.describedBy}
        disabled={disabled}
        value={draft}
        placeholder={clearedZero ? "0" : placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={controlClass(visualStatus, `py-2 tabular-nums ${showStepper ? "text-center px-9" : `pl-3 ${visualStatus === "neutral" ? "pr-3" : "pr-9"}`} ${className ?? ""}`)}
        {...inputProps}
      />
      <StatusIcon status={visualStatus} />
    </div>
  );

  return (
    <FieldShell label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={error} {...ids}>
      {showStepper ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={Minus}
            aria-label={t("fields.decrement")}
            disabled={disabled || atMin}
            tabIndex={-1}
            onClick={() => stepBy(-1)}
            className="h-10 w-10 shrink-0 hover:-rotate-12"
          />
          {input}
          <Button
            variant="outline"
            icon={Plus}
            aria-label={t("fields.increment")}
            disabled={disabled || atMax}
            tabIndex={-1}
            onClick={() => stepBy(1)}
            className="h-10 w-10 shrink-0 hover:rotate-12"
          />
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
}
