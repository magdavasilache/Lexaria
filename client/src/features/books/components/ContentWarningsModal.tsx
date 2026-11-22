import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldAlert, Trash2 } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import FieldShell from "../../../shared/forms/fields/FieldShell";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useContentWarnings } from "../hooks/useContentWarnings";
import { contentWarningsSchema, type ContentWarningsValues } from "../schemas/bookSchemas";
import { CONTENT_WARNINGS, WARNING_SEVERITIES, type ContentWarning, type ContentWarnings, type WarningSeverity } from "../types/bookTypes";

type Props = {
    bookId: number;
    title: string;
    warnings: ContentWarnings;
    onClose: () => void;
};

const toValues = (warnings: ContentWarnings): ContentWarningsValues => ({
    reports: Object.fromEntries(warnings.mine.map((report) => [report.warning, report.severity])),
});

export default function ContentWarningsModal({ bookId, title, warnings, onClose }: Props) {
    const { t } = useTranslation(["front/books", "front/common"]);
    const formId = useId();
    const fieldId = useId();
    const { save, remove } = useContentWarnings(bookId);
    const hasReport = warnings.mine.length > 0;
    const { control, handleSubmit, setError, formState: { errors, isSubmitting, isDirty } } = useForm<ContentWarningsValues>({
        resolver: zodResolver(contentWarningsSchema),
        mode: "onTouched",
        defaultValues: toValues(warnings),
    });
    const busy = isSubmitting || remove.isPending;

    const submit = async ({ reports }: ContentWarningsValues) => {
        const chosen = Object.entries(reports).filter((entry): entry is [ContentWarning, WarningSeverity] => Boolean(entry[1]));
        try {
            await save.mutateAsync({ warnings: chosen.map(([warning, severity]) => ({ warning, severity })) });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, ["reports"], { warnings: "reports" });
        }
    };

    const removeReport = async () => {
        try {
            await remove.mutateAsync();
            onClose();
        } catch {
            return;
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="lg"
            icon={ShieldAlert}
            title={t("warnings.reportTitle")}
            description={t("warnings.reportDescription", { title })}
            dismissible={!busy}
            unsavedChanges={isDirty}
            footer={
                <>
                    {hasReport && (
                        <Button variant="ghost" size="sm" leftIcon={Trash2} onClick={removeReport} loading={remove.isPending} loadingText={t("warnings.removing")} disabled={isSubmitting} className="min-h-10 sm:mr-auto">
                            {t("warnings.removeReport")}
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={busy} className="min-h-10">
                        {t("front/common:actions.cancel")}
                    </Button>
                    <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("warnings.saving")} disabled={remove.isPending} className="min-h-10">
                        {t("warnings.save")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(submit)}>
                <Controller
                    name="reports"
                    control={control}
                    render={({ field }) => (
                        <FieldShell
                            as="fieldset"
                            label={t("warnings.reportLabel")}
                            helperText={t("warnings.reportHelper")}
                            error={errors.reports}
                            inputId={fieldId}
                            helperId={`${fieldId}-helper`}
                            errorId={`${fieldId}-error`}
                        >
                            <ul className="flex flex-col divide-y divide-panelBorderLight dark:divide-panelBorderDark">
                                {CONTENT_WARNINGS.map((warning) => {
                                    const current = field.value[warning] ?? null;
                                    const choose = (severity: WarningSeverity) =>
                                        field.onChange({ ...field.value, [warning]: current === severity ? null : severity });
                                    return (
                                        <li key={warning} className="flex flex-col gap-1.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                            <span className="text-sm">{t(`warnings.types.${warning}`)}</span>
                                            <div
                                                role="group"
                                                aria-label={t(`warnings.types.${warning}`)}
                                                className="flex w-full overflow-hidden rounded-control border border-primaryLight dark:border-primaryDark divide-x divide-primaryLight/40 dark:divide-primaryDark/40 sm:w-72 sm:shrink-0"
                                            >
                                                {WARNING_SEVERITIES.map((severity) => (
                                                    <Button key={severity} variant="segment" size="sm" aria-pressed={current === severity} onClick={() => choose(severity)} className="min-h-10">
                                                        {t(`warnings.severities.${severity}`)}
                                                    </Button>
                                                ))}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </FieldShell>
                    )}
                />
            </form>
        </Modal>
    );
}
