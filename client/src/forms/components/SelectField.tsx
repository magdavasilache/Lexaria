import { ReactNode, Ref, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { FieldStatus } from "../useFieldStatus";
import FieldShell, { StatusIcon } from "./FieldShell";
import { FieldErrorLike, controlClass, resolveStatus, useFieldIds } from "./fieldStyles";

export type SelectOption = { value: string | number; label: string; disabled?: boolean };

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hideLabel?: boolean;
  options: SelectOption[];
  placeholder?: string;
  error?: FieldErrorLike;
  helperText?: ReactNode;
  status?: FieldStatus;
  ref?: Ref<HTMLSelectElement>;
};

export default function SelectField({ label, hideLabel, options, placeholder, error, helperText, status = "neutral", required, id, className, ref, ...selectProps }: SelectFieldProps) {
  const ids = useFieldIds(id, Boolean(helperText), error);
  const visualStatus = resolveStatus(error, status);

  return (
    <FieldShell label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={error} {...ids}>
      <div className={`group/select relative ${error?.message ? "animate-shake" : ""}`}>
        <select
          id={ids.inputId}
          ref={ref}
          aria-required={required || undefined}
          aria-invalid={error?.message ? true : undefined}
          aria-describedby={ids.describedBy}
          className={controlClass(visualStatus, `cursor-pointer appearance-none truncate py-2 pl-3 ${visualStatus === "neutral" ? "pr-10" : "pr-16"} ${className ?? ""}`)}
          {...selectProps}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <StatusIcon status={visualStatus} className="right-9 top-1/2 -translate-y-1/2" />
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 text-secondaryActiveLight transition-transform duration-300 ease-spring group-hover/select:translate-y-[-40%] group-focus-within/select:rotate-180 group-focus-within/select:text-primaryLight dark:text-primaryActiveDark dark:group-focus-within/select:text-primaryDark"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}
