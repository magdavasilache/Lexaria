import { ChangeEvent, ReactNode, Ref, TextareaHTMLAttributes, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FieldStatus } from "../useFieldStatus";
import FieldShell, { StatusIcon } from "./FieldShell";
import { FieldErrorLike, controlClass, resolveStatus, useFieldIds } from "./fieldStyles";

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hideLabel?: boolean;
  error?: FieldErrorLike;
  helperText?: ReactNode;
  status?: FieldStatus;
  showCount?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
};

const counterTone = (ratio: number) => {
  if (ratio >= 1) return "text-errorLight dark:text-errorDark font-semibold";
  if (ratio >= 0.9) return "text-warningLight dark:text-warningDark font-medium";
  return "text-fontMutedLight dark:text-fontMutedDark";
};

export default function TextAreaField({ label, hideLabel, error, helperText, status = "neutral", showCount = true, required, id, className, rows = 4, maxLength, onChange, ref, ...textareaProps }: TextAreaFieldProps) {
  const { t } = useTranslation();
  const ids = useFieldIds(id, Boolean(helperText), error);
  const visualStatus = resolveStatus(error, status);
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const [length, setLength] = useState(0);
  const counted = showCount && maxLength !== undefined;

  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

  const syncLength = () => setLength(innerRef.current?.value.length ?? 0);

  useLayoutEffect(syncLength);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setLength(event.target.value.length);
    onChange?.(event);
  };

  const counter = counted && (
    <span className={`shrink-0 text-xs tabular-nums transition-colors ${counterTone(length / maxLength)}`}>
      <span aria-hidden="true">{length}/{maxLength}</span>
      <span className="sr-only">{t("fields.charactersLeft", { count: Math.max(maxLength - length, 0) })}</span>
    </span>
  );

  return (
    <FieldShell label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={error} labelAddon={counter} {...ids}>
      <div className={`relative ${error?.message ? "animate-shake" : ""}`}>
        <textarea
          id={ids.inputId}
          ref={innerRef}
          rows={rows}
          maxLength={maxLength}
          onChange={handleChange}
          aria-required={required || undefined}
          aria-invalid={error?.message ? true : undefined}
          aria-describedby={ids.describedBy}
          className={controlClass(visualStatus, `block resize-y py-2 pl-3 ${visualStatus === "neutral" ? "pr-3" : "pr-9"} ${className ?? ""}`)}
          {...textareaProps}
        />
        <StatusIcon status={visualStatus} className="right-2.5 top-2.5" />
      </div>
    </FieldShell>
  );
}
