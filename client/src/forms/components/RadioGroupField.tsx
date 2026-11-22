import { InputHTMLAttributes, ReactNode, Ref, useId } from "react";
import { LucideIcon } from "lucide-react";
import { FieldStatus } from "../useFieldStatus";
import FieldShell from "./FieldShell";
import { CHECK_BOX_CLASS } from "./CheckboxField";
import { FieldErrorLike, resolveStatus } from "./fieldStyles";

export type RadioOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
  action?: ReactNode;
};

type RadioGroupFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue"> & {
  label: string;
  hideLabel?: boolean;
  options: RadioOption[];
  layout?: "list" | "cards";
  error?: FieldErrorLike;
  helperText?: ReactNode;
  status?: FieldStatus;
  ref?: Ref<HTMLInputElement>;
};

const LAYOUTS = {
  list: "flex flex-col gap-0.5",
  cards: "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3",
} as const;

const OPTION_LAYOUTS = {
  list: "min-h-10 rounded-control px-1 -mx-1 hover:bg-panelHoverLight dark:hover:bg-panelHoverDark",
  cards:
    "min-h-12 rounded-panel border p-3 bg-panelLight dark:bg-panelDark hover:bg-panelHoverLight dark:hover:bg-panelHoverDark " +
    "hover:-translate-y-0.5 hover:shadow-soft-sm dark:hover:shadow-deep-sm " +
    "has-[:checked]:bg-panelSelectedLight dark:has-[:checked]:bg-panelSelectedDark " +
    "has-[:checked]:border-primaryLight dark:has-[:checked]:border-primaryDark has-[:checked]:ring-1 has-[:checked]:ring-primaryLight dark:has-[:checked]:ring-primaryDark " +
    "has-[:focus-visible]:shadow-focusLight dark:has-[:focus-visible]:shadow-focusDark",
} as const;

export default function RadioGroupField({ label, hideLabel, options, layout = "list", error, helperText, status = "neutral", required, id, className, ref, ...inputProps }: RadioGroupFieldProps) {
  const baseId = useId();
  const groupId = id ?? baseId;
  const helperId = `${groupId}-helper`;
  const errorId = `${groupId}-error`;
  const visualStatus = resolveStatus(error, status);
  const describedBy = [helperText ? helperId : null, error?.message ? errorId : null].filter(Boolean).join(" ") || undefined;
  const cardBorder = visualStatus === "invalid" ? "border-errorLight dark:border-errorDark" : "border-panelBorderLight dark:border-panelBorderDark";
  const ringTone =
    visualStatus === "invalid"
      ? "border-errorLight dark:border-errorDark"
      : "border-borderStrongLight dark:border-espresso-400 group-hover/radio:border-primaryLight dark:group-hover/radio:border-primaryDark checked:border-primaryLight dark:checked:border-primaryDark";

  return (
    <FieldShell as="fieldset" label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={error} inputId={groupId} helperId={helperId} errorId={errorId}>
      <div className={`${LAYOUTS[layout]} ${error?.message ? "animate-shake" : ""}`}>
        {options.map(({ value, label: optionLabel, description, icon: Icon, disabled, action }) => {
          const optionId = `${groupId}-${value}`;
          const option = (
            <label
              key={value}
              htmlFor={optionId}
              className={`group/radio flex cursor-pointer items-start gap-2.5 transition-all duration-200 ease-out-expo has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 ${OPTION_LAYOUTS[layout]} ${layout === "cards" ? cardBorder : ""} ${action ? "h-full pr-12" : ""}`}
            >
              <span className={`relative flex h-5 w-5 shrink-0 ${layout === "list" ? "mt-2" : "mt-0.5"}`}>
                <input
                  id={optionId}
                  ref={ref}
                  type="radio"
                  value={value}
                  disabled={disabled}
                  aria-invalid={error?.message ? true : undefined}
                  aria-describedby={describedBy}
                  className={`${CHECK_BOX_CLASS} rounded-full ${ringTone} ${className ?? ""}`}
                  {...inputProps}
                />
                <span className="pointer-events-none absolute inset-1 scale-0 rounded-full bg-primaryLight transition-transform duration-300 ease-spring peer-checked:scale-100 dark:bg-primaryDark" aria-hidden="true" />
              </span>
              <span className={`flex min-w-0 flex-col ${layout === "list" ? "py-2" : ""}`}>
                <span className="flex items-center gap-1.5 text-sm font-libre text-fontPrimaryLight dark:text-fontPrimaryDark">
                  {Icon && (
                    <Icon className="h-4 w-4 shrink-0 text-secondaryActiveLight transition-transform duration-300 ease-spring group-hover/radio:-rotate-12 group-has-[:checked]/radio:text-primaryLight dark:text-primaryActiveDark dark:group-has-[:checked]/radio:text-primaryDark" aria-hidden="true" />
                  )}
                  {optionLabel}
                </span>
                {description && <span className="text-xs text-fontMutedLight dark:text-fontMutedDark">{description}</span>}
              </span>
            </label>
          );
          return action ? (
            <div key={value} className="relative">
              {option}
              <div className="absolute right-1 top-1">{action}</div>
            </div>
          ) : (
            option
          );
        })}
      </div>
    </FieldShell>
  );
}
