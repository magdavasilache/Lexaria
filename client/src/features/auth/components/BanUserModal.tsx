import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import SelectField from "../../../shared/forms/fields/SelectField";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { BanFormValues, PERMANENT_BAN, banSchema } from "../schemas/banSchema";
import { BAN_RULES } from "../schemas/userRules";
import { useBanUser } from "../hooks/useAdminUsers";
import type { AdminUser } from "../userTypes";

const FIELDS = ["reason", "duration"] as const;
const ALIASES = { duration_days: "duration" } as const;
const DEFAULT_DURATION = "7";

export default function BanUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
    const { t } = useTranslation(["front/users", "front/common"]);
    const formId = useId();
    const ban = useBanUser();
    const { register, handleSubmit, control, setError, formState: { errors, isSubmitting, isDirty } } = useForm<BanFormValues>({
        resolver: zodResolver(banSchema),
        mode: "onTouched",
        defaultValues: { reason: "", duration: DEFAULT_DURATION },
    });
    const fieldStatus = useFieldStatus(banSchema, control);

    const durations = [
        ...BAN_RULES.durations.map((days) => ({ value: String(days), label: t("ban.days", { count: days }) })),
        { value: PERMANENT_BAN, label: t("ban.permanent") },
    ];

    const submit = async (values: BanFormValues) => {
        try {
            await ban.mutateAsync({
                userId: user.id,
                body: { reason: values.reason, duration_days: values.duration === PERMANENT_BAN ? null : Number(values.duration) },
            });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS, ALIASES);
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            size="sm"
            icon={Ban}
            title={t("ban.title", { username: user.username })}
            description={t("ban.description")}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="min-h-10">{t("front/common:actions.cancel")}</Button>
                    <Button type="submit" form={formId} variant="danger" size="sm" loading={isSubmitting} loadingText={t("ban.submitting")} className="min-h-10">
                        {t("ban.submit")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <Controller
                    name="duration"
                    control={control}
                    render={({ field }) => (
                        <SelectField
                            label={t("ban.duration")}
                            required
                            options={durations}
                            helperText={t("ban.durationHelper")}
                            error={errors.duration}
                            status={fieldStatus("duration")}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                        />
                    )}
                />
                <TextAreaField
                    label={t("ban.reason")}
                    required
                    rows={3}
                    showCount
                    maxLength={BAN_RULES.reasonMaxLength}
                    helperText={t("ban.reasonHelper")}
                    error={errors.reason}
                    status={fieldStatus("reason")}
                    {...register("reason")}
                />
                <RequiredFieldsNote />
            </form>
        </Modal>
    );
}
