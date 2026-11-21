import { InputHTMLAttributes, ReactNode, Ref } from "react";
import { CalendarDays } from "lucide-react";
import { FieldStatus } from "../useFieldStatus";
import FieldShell from "./FieldShell";
import { FieldErrorLike, controlClass, resolveStatus, useFieldIds } from "./fieldStyles";

type DateFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  hideLabel?: boolean;
  error?: FieldErrorLike;
  helperText?: ReactNode;
  status?: FieldStatus;
  ref?: Ref<HTMLInputElement>;
};

export const DATE_INPUT_CLASS =
  "py-2 pl-3 pr-10 [color-scheme:light] tabular-nums " +
  "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 " +
  "[&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-10 " +
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 " +
  "[&::-webkit-datetime-edit-fields-wrapper]:p-0";

export function CalendarBadge({ status }: { status: FieldStatus }) {
  const tone =
    status === "invalid"
      ? "text-errorLight dark:text-errorSolidDark"
      : status === "valid"
        ? "text-successLight dark:text-successSolidLight"
        : "text-secondaryActiveLight dark:text-primaryActiveDark group-focus-within/date:text-primaryLight dark:group-focus-within/date:text-primaryDark";

  return (
    <CalendarDays
      className={`pointer-events-none absolute right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 supports-[-moz-appearance:none]:hidden transition-transform duration-300 ease-spring group-focus-within/date:-rotate-6 group-focus-within/date:scale-110 group-hover/date:-rotate-6 ${tone}`}
      aria-hidden="true"
    />
  );
}

export default function DateField({ label, hideLabel, error, helperText, status = "neutral", required, id, className, ref, ...inputProps }: DateFieldProps) {
  const ids = useFieldIds(id, Boolean(helperText), error);
  const visualStatus = resolveStatus(error, status);

  return (
    <FieldShell label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={error} {...ids}>
      <div className={`group/date relative ${error?.message ? "animate-shake" : ""}`}>
        <input
          id={ids.inputId}
          ref={ref}
          type="date"
          aria-required={required || undefined}
          aria-invalid={error?.message ? true : undefined}
          aria-describedby={ids.describedBy}
          className={controlClass(visualStatus, `${DATE_INPUT_CLASS} ${className ?? ""}`)}
          {...inputProps}
        />
        <CalendarBadge status={visualStatus} />
      </div>
    </FieldShell>
  );
}
