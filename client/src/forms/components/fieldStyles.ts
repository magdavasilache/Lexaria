import { useId } from "react";
import { FieldStatus } from "../useFieldStatus";

export type FieldErrorLike = { message?: string };

export const STATUS_STYLES: Record<FieldStatus, string> = {
  invalid:
    "border-errorLight ring-1 ring-errorLight bg-errorLightTone/60 " +
    "dark:border-errorDark dark:ring-errorDark dark:bg-scarlet-50 " +
    "focus-visible:shadow-focusErrorLight dark:focus-visible:shadow-focusErrorDark " +
    "focus-within:shadow-focusErrorLight dark:focus-within:shadow-focusErrorDark",
  valid:
    "border-successLight bg-white/70 dark:border-successSolidLight dark:bg-inputDark " +
    "focus-visible:shadow-focusLight dark:focus-visible:shadow-focusDark " +
    "focus-within:shadow-focusLight dark:focus-within:shadow-focusDark",
  neutral:
    "border-borderStrongLight bg-white/70 dark:border-dividerDark dark:bg-inputDark " +
    "hover:border-parchment-600 dark:hover:border-espresso-500 " +
    "focus-visible:border-primaryLight dark:focus-visible:border-primaryDark " +
    "focus-visible:shadow-focusLight dark:focus-visible:shadow-focusDark " +
    "focus-within:border-primaryLight dark:focus-within:border-primaryDark " +
    "focus-within:shadow-focusLight dark:focus-within:shadow-focusDark",
};

export const CONTROL_BASE =
  "w-full min-h-10 border rounded-control shadow-inputInset text-base sm:text-sm " +
  "text-onInputLight dark:text-onInputDark placeholder:text-fontMutedLight dark:placeholder:text-espresso-400 " +
  "outline-none transition-[border-color,box-shadow,background-color] duration-200 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const controlClass = (status: FieldStatus, extra = "") => `${CONTROL_BASE} ${STATUS_STYLES[status]} ${extra}`;

export const resolveStatus = (error: FieldErrorLike | undefined, status: FieldStatus): FieldStatus =>
  error?.message ? "invalid" : status;

export const useFieldIds = (id: string | undefined, hasHelper: boolean, error: FieldErrorLike | undefined) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const describedBy = [hasHelper ? helperId : null, error?.message ? errorId : null].filter(Boolean).join(" ") || undefined;
  return { inputId, helperId, errorId, describedBy };
};
