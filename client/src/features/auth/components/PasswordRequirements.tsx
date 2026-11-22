import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PASSWORD_REQUIREMENTS } from "../schemas/userRules";

export default function PasswordRequirements({ value }: { value: string }) {
  const { t } = useTranslation("front/users", { keyPrefix: "passwordRequirements" });

  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2" aria-label={t("label")}>
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const met = requirement.test(value);
        return (
          <li
            key={requirement.id}
            className={`flex items-center gap-1.5 transition-colors ${met ? "text-successTextLight dark:text-successDark" : "text-fontMutedLight dark:text-fontMutedDark"}`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${met ? "bg-successLightTone dark:bg-successDarkTone" : "bg-black/5 dark:bg-white/10"}`}
            >
              {met ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : <X className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
            </span>
            <span>{t(requirement.id)}</span>
            <span className="sr-only">{met ? t("met") : t("notMet")}</span>
          </li>
        );
      })}
    </ul>
  );
}
