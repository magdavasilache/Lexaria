import { ChangeEvent, FocusEvent, InputHTMLAttributes, KeyboardEvent, ReactNode, Ref, useImperativeHandle, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import Button from "../../global-components/buttons/Button";
import { FieldStatus } from "../useFieldStatus";
import FieldShell from "./FieldShell";
import DateCalendar from "./DateCalendar";
import { FieldErrorLike, controlClass, resolveStatus, useFieldIds } from "./fieldStyles";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  status: FieldStatus;
  ref?: Ref<HTMLInputElement>;
};

type DateFieldProps = Omit<DateInputProps, "status"> & {
  label: string;
  hideLabel?: boolean;
  error?: FieldErrorLike;
  helperText?: ReactNode;
  status?: FieldStatus;
};

const DATE_INPUT_CLASS =
  "py-2 pl-3 pr-11 supports-[-moz-appearance:none]:pr-3 [color-scheme:light] dark:[color-scheme:dark] tabular-nums " +
  "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-fields-wrapper]:p-0";

const setNativeValue = (input: HTMLInputElement, value: string) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

export function DateInput({ status, min, max, required, disabled, className, onChange, onKeyDown, onClick, ref, ...inputProps }: DateInputProps) {
  const { t } = useTranslation();
  const minDate = min === undefined ? undefined : String(min);
  const maxDate = max === undefined ? undefined : String(max);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [focusCalendar, setFocusCalendar] = useState(false);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const tone =
    status === "invalid"
      ? "text-errorLight dark:text-errorSolidDark"
      : status === "valid"
        ? "text-successLight dark:text-successSolidLight"
        : "text-secondaryActiveLight dark:text-primaryActiveDark";

  const openCalendar = (focus: boolean) => {
    if (disabled || inputProps.readOnly) return;
    setFocusCalendar(focus);
    setCurrent(inputRef.current?.value ?? "");
    setOpen(true);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) inputRef.current?.focus();
  };

  const select = (value: string) => {
    if (inputRef.current) setNativeValue(inputRef.current, value);
    setCurrent(value);
    close(true);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrent(event.target.value);
    onChange?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.key === "ArrowDown" && event.altKey) {
      event.preventDefault();
      openCalendar(true);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      close(false);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!wrapperRef.current?.contains(next) && !calendarRef.current?.contains(next)) setOpen(false);
  };

  return (
    <div ref={wrapperRef} onBlur={handleBlur} className="group/date relative">
      <input
        ref={inputRef}
        type="date"
        min={min}
        max={max}
        disabled={disabled}
        aria-required={required || undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          event.preventDefault();
          onClick?.(event);
          if (!open) openCalendar(false);
        }}
        className={controlClass(status, `${DATE_INPUT_CLASS} ${className ?? ""}`)}
        {...inputProps}
      />
      <Button
        variant="ghost"
        size="sm"
        icon={CalendarDays}
        tabIndex={-1}
        disabled={disabled}
        aria-label={t("fields.calendar.open")}
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => (open ? close(true) : openCalendar(true))}
        iconClassName={`h-5 w-5 transition-transform duration-300 ease-spring group-focus-within/date:-rotate-6 group-focus-within/date:scale-110 group-hover/date:-rotate-6 ${open ? "text-primaryLight dark:text-primaryDark" : tone}`}
        className="absolute right-0.5 top-1/2 h-9 w-9 -translate-y-1/2 justify-center supports-[-moz-appearance:none]:hidden hover:bg-panelHoverLight dark:hover:bg-panelHoverDark"
      />
      {open && (
        <DateCalendar
          value={current}
          min={minDate}
          max={maxDate}
          clearable={!required}
          autoFocus={focusCalendar}
          anchorRef={wrapperRef}
          panelRef={calendarRef}
          onSelect={select}
          onClose={() => close(true)}
        />
      )}
    </div>
  );
}

export default function DateField({ label, hideLabel, error, helperText, status = "neutral", required, id, ...inputProps }: DateFieldProps) {
  const ids = useFieldIds(id, Boolean(helperText), error);
  const visualStatus = resolveStatus(error, status);

  return (
    <FieldShell label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={error} {...ids}>
      <div className={error?.message ? "animate-shake" : ""}>
        <DateInput
          id={ids.inputId}
          status={visualStatus}
          required={required}
          aria-invalid={error?.message ? true : undefined}
          aria-describedby={ids.describedBy}
          {...inputProps}
        />
      </div>
    </FieldShell>
  );
}
