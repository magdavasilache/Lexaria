import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Trophy } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import NumberField from "../../../shared/forms/fields/NumberField";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { CHALLENGE_TARGET_REQUIRED, ChallengeValues, challengeSchema } from "../schemas/statsSchemas";
import { CHALLENGE_RULES } from "../schemas/statsRules";
import { useDeleteChallenge, useSetChallenge } from "../hooks/useStats";
import type { Challenge } from "../statsTypes";

const FIELDS = ["books", "pages", "hours"] as const;
const ALIASES = { books_target: "books", pages_target: "pages", hours_target: "hours" } as const;
const TARGETS = [
    { name: "books", max: CHALLENGE_RULES.booksMax, step: 1 },
    { name: "pages", max: CHALLENGE_RULES.pagesMax, step: 100 },
    { name: "hours", max: CHALLENGE_RULES.hoursMax, step: 5 },
] as const;

type Props = { year: number; challenge: Challenge | null; onClose: () => void };

export default function ChallengeForm({ year, challenge, onClose }: Props) {
    const { t } = useTranslation(["front/stats", "front/common"]);
    const formId = useId();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const setChallenge = useSetChallenge();
    const deleteChallenge = useDeleteChallenge();
    const { handleSubmit, control, setError, formState: { errors, isSubmitting, isDirty } } = useForm<ChallengeValues>({
        resolver: zodResolver(challengeSchema),
        mode: "onTouched",
        defaultValues: {
            books: challenge?.books_target ?? null,
            pages: challenge?.pages_target ?? null,
            hours: challenge?.hours_target ?? null,
        },
    });
    const fieldStatus = useFieldStatus(challengeSchema, control);
    const groupError = FIELDS.some((field) => errors[field]?.message === CHALLENGE_TARGET_REQUIRED);
    const busy = isSubmitting || deleteChallenge.isPending;

    const submit = async (values: ChallengeValues) => {
        try {
            await setChallenge.mutateAsync({
                year,
                data: { books_target: values.books, pages_target: values.pages, hours_target: values.hours },
            });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS, ALIASES);
        }
    };

    const remove = () => deleteChallenge.mutate(year, { onSuccess: onClose });

    return (
        <Modal
            open
            onClose={onClose}
            size="sm"
            icon={Trophy}
            title={t("form.title", { year })}
            description={t("form.description")}
            dismissible={!busy}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={busy} className="min-h-10">{t("front/common:actions.cancel")}</Button>
                    <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("form.submitting")} disabled={deleteChallenge.isPending} className="min-h-10">
                        {t("form.submit")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <p
                    role={groupError ? "alert" : undefined}
                    className={`text-xs ${groupError ? "font-medium text-errorTextLight dark:text-errorTextDark" : "text-fontMutedLight dark:text-fontMutedDark"}`}
                >
                    {groupError ? t("validation.targetRequired") : t("form.targetsHint")}
                </p>
                {TARGETS.map(({ name, max, step }) => (
                    <Controller
                        key={name}
                        name={name}
                        control={control}
                        render={({ field }) => (
                            <NumberField
                                label={t(`metrics.${name}`)}
                                min={CHALLENGE_RULES.targetMin}
                                max={max}
                                step={step}
                                helperText={t(`form.${name}Helper`)}
                                error={groupError ? undefined : errors[name]}
                                aria-invalid={groupError || undefined}
                                status={fieldStatus(name)}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                            />
                        )}
                    />
                ))}
            </form>

            {challenge && (
                <div className="mt-4 flex flex-col gap-2 border-t border-dividerLight pt-3 dark:border-dividerDark">
                    {confirmingDelete ? (
                        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="min-w-0 flex-1">{t("form.deleteConfirm", { year })}</span>
                            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={busy} className="min-h-10">
                                {t("form.keep")}
                            </Button>
                            <Button variant="danger" size="sm" leftIcon={Trash2} loading={deleteChallenge.isPending} loadingText={t("form.deleting")} disabled={isSubmitting} onClick={remove} className="min-h-10">
                                {t("form.delete")}
                            </Button>
                        </div>
                    ) : (
                        <Button variant="menuDanger" size="sm" leftIcon={Trash2} onClick={() => setConfirmingDelete(true)} disabled={busy} className="min-h-10 self-start">
                            {t("form.delete")}
                        </Button>
                    )}
                </div>
            )}
        </Modal>
    );
}
