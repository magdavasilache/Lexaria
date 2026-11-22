import { useTranslation } from "react-i18next";

export default function RequiredFieldsNote() {
  const { t } = useTranslation();

  return (
    <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">
      <span className="text-errorLight dark:text-errorDark" aria-hidden="true">*</span> {t("form.requiredField")}
    </p>
  );
}
