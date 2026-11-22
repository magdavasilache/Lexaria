import { InputHTMLAttributes, ReactNode, Ref } from "react";
import { LucideIcon } from "lucide-react";
import { FieldStatus } from "../useFieldStatus";
import FieldShell, { StatusIcon } from "./FieldShell";
import { FieldErrorLike, controlClass, resolveStatus, useFieldIds } from "./fieldStyles";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hideLabel?: boolean;
  error?: FieldErrorLike;
  helperText?: ReactNode;
  status?: FieldStatus;
  leftIcon?: LucideIcon;
  ref?: Ref<HTMLInputElement>;
};

export default function FormField({ label, hideLabel, error, helperText, status = "neutral", leftIcon: LeftIcon, required, id, className, ref, ...inputProps }: FormFieldProps) {
  const ids = useFieldIds(id, Boolean(helperText), error);
  const visualStatus = resolveStatus(error, status);

  return (
    <FieldShell label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={error} {...ids}>
      <div className={`relative ${error?.message ? "animate-shake" : ""}`}>
        {LeftIcon && (
          <LeftIcon
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fontMutedLight transition-colors group-focus-within/field:text-primaryLight dark:text-espresso-400 dark:group-focus-within/field:text-primaryActiveDark"
            aria-hidden="true"
          />
        )}
        <input
          id={ids.inputId}
          ref={ref}
          aria-required={required || undefined}
          aria-invalid={error?.message ? true : undefined}
          aria-describedby={ids.describedBy}
          className={controlClass(visualStatus, `py-2 ${LeftIcon ? "pl-9" : "pl-3"} ${visualStatus === "neutral" ? "pr-3" : "pr-9"} ${className ?? ""}`)}
          {...inputProps}
        />
        <StatusIcon status={visualStatus} />
      </div>
    </FieldShell>
  );
}
