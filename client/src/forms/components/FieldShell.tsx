import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CircleAlert, CircleCheck } from "lucide-react";
import { decodeMessage, translate } from "../../i18n/message";
import { FieldStatus } from "../useFieldStatus";
import { FieldErrorLike } from "./fieldStyles";

type FieldShellProps = {
  label: string;
  hideLabel?: boolean;
  required?: boolean;
  helperText?: ReactNode;
  error?: FieldErrorLike;
  inputId: string;
  helperId: string;
  errorId: string;
  as?: "div" | "fieldset";
  labelAddon?: ReactNode;
  onLabelClick?: () => void;
  children: ReactNode;
};

const LABEL_CLASS =
  "flex items-baseline gap-0.5 text-sm font-libre text-fontPrimaryLight dark:text-fontPrimaryDark transition-colors duration-200 " +
  "group-focus-within/field:text-primaryLight dark:group-focus-within/field:text-primaryDark";

export default function FieldShell({ label, hideLabel, required, helperText, error, inputId, helperId, errorId, as = "div", labelAddon, onLabelClick, children }: FieldShellProps) {
  useTranslation();
  const Wrapper = as;
  const labelContent = (
    <>
      {label}
      {required && <span className="ml-0.5 text-errorLight dark:text-errorDark" aria-hidden="true">*</span>}
    </>
  );

  return (
    <Wrapper className="group/field flex min-w-0 flex-col gap-1 border-0 p-0 m-0">
      {as === "fieldset" ? (
        <legend className={`${hideLabel ? "sr-only" : `${LABEL_CLASS} mb-1`}`}>{labelContent}</legend>
      ) : (
        <div className={hideLabel ? "sr-only" : "flex items-baseline justify-between gap-2"}>
          <label htmlFor={inputId} onClick={onLabelClick} className={LABEL_CLASS}>{labelContent}</label>
          {labelAddon}
        </div>
      )}
      {children}
      {helperText && (
        <div id={helperId} className="text-xs text-fontMutedLight dark:text-fontMutedDark">
          {helperText}
        </div>
      )}
      {error?.message && (
        <p id={errorId} role="alert" className="flex items-start gap-1 text-xs font-medium text-errorLight dark:text-errorDark animate-slide-down">
          <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{translate(decodeMessage(error.message))}</span>
        </p>
      )}
    </Wrapper>
  );
}

export function StatusIcon({ status, className = "right-2.5 top-1/2 -translate-y-1/2" }: { status: FieldStatus; className?: string }) {
  if (status === "invalid") {
    return (
      <CircleAlert
        className={`pointer-events-none absolute h-5 w-5 text-errorLight dark:text-errorSolidDark ${className}`}
        aria-hidden="true"
      />
    );
  }
  if (status === "valid") {
    return (
      <span className={`pointer-events-none absolute ${className}`} aria-hidden="true">
        <CircleCheck className="h-5 w-5 text-successLight dark:text-successSolidLight animate-pop" />
      </span>
    );
  }
  return null;
}
