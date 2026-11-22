import { InputHTMLAttributes, ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";
import { Check, CircleAlert } from "lucide-react";
import { decodeMessage, translate } from "../../../i18n/message";
import { FieldErrorLike, useFieldIds } from "./fieldStyles";

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  helperText?: ReactNode;
  error?: FieldErrorLike;
  ref?: Ref<HTMLInputElement>;
};

export const CHECK_BOX_CLASS =
  "peer absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none border-2 bg-white/80 dark:bg-inputDark " +
  "transition-[background-color,border-color,box-shadow] duration-200 outline-none " +
  "focus-visible:shadow-focusLight dark:focus-visible:shadow-focusDark " +
  "checked:animate-pop disabled:cursor-not-allowed disabled:opacity-50";

export default function CheckboxField({ label, helperText, error, required, id, className, ref, ...inputProps }: CheckboxFieldProps) {
  useTranslation();
  const { inputId, helperId, errorId, describedBy } = useFieldIds(id, Boolean(helperText), error);
  const tone = error?.message
    ? "border-errorLight dark:border-errorDark checked:bg-errorLight checked:border-errorLight"
    : "border-borderStrongLight dark:border-espresso-400 group-hover/check:border-primaryLight dark:group-hover/check:border-primaryDark " +
      "checked:border-primaryLight checked:bg-primaryLight dark:checked:border-primaryDark dark:checked:bg-primaryDark";

  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={inputId} className="group/check inline-flex min-h-10 cursor-pointer items-center gap-2.5 self-start text-sm font-libre text-fontPrimaryLight dark:text-fontPrimaryDark">
        <span className="relative flex h-5 w-5 shrink-0">
          <input
            id={inputId}
            ref={ref}
            type="checkbox"
            aria-required={required || undefined}
            aria-invalid={error?.message ? true : undefined}
            aria-describedby={describedBy}
            className={`${CHECK_BOX_CLASS} rounded-control ${tone} ${className ?? ""}`}
            {...inputProps}
          />
          <Check
            className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 -rotate-12 scale-0 text-onPrimaryLight transition-transform duration-300 ease-spring peer-checked:rotate-0 peer-checked:scale-100 dark:text-onPrimaryDark"
            strokeWidth={3.5}
            aria-hidden="true"
          />
        </span>
        <span>
          {label}
          {required && <span className="ml-0.5 text-errorLight dark:text-errorDark" aria-hidden="true">*</span>}
        </span>
      </label>
      {helperText && (
        <div id={helperId} className="pl-[1.875rem] text-xs text-fontMutedLight dark:text-fontMutedDark">
          {helperText}
        </div>
      )}
      {error?.message && (
        <p id={errorId} role="alert" className="flex items-start gap-1 pl-[1.875rem] text-xs font-medium text-errorLight dark:text-errorDark animate-slide-down">
          <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{translate(decodeMessage(error.message))}</span>
        </p>
      )}
    </div>
  );
}
