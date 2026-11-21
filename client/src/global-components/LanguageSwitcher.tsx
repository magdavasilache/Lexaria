import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "./buttons/Button";
import { LANGUAGES, Language } from "../i18n";

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? "en") as Language;
  const next = LANGUAGES[(LANGUAGES.indexOf(current) + 1) % LANGUAGES.length];

  return (
    <Button
      variant="ghost"
      size="sm"
      leftIcon={Languages}
      className="min-h-10 min-w-10"
      aria-label={t("language.switchTo", { language: t(`language.${next}`) })}
      title={t("language.switchTo", { language: t(`language.${next}`) })}
      onClick={() => i18n.changeLanguage(next)}
    >
      {next.toUpperCase()}
    </Button>
  );
}
