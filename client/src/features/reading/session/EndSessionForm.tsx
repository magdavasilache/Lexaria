import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flag, Trash2 } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import NumberField from "../../../shared/forms/fields/NumberField";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import CheckboxField from "../../../shared/forms/fields/CheckboxField";
import FormField from "../../../shared/forms/fields/FormField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { EndSessionValues, endSessionSchema } from "../schemas/readingSchemas";
import { READING_RULES } from "../schemas/readingRules";
import { useDiscardSession, useEndSession } from "../hooks/useSessionMutations";
import type { ActiveSession } from "../types/readingTypes";
import { lastProgress, progressBounds } from "./progress";
import { fromLocalInput, toLocalInput } from "../../../shared/utils/dates";

type Props = {
    session: ActiveSession;
    elapsedSeconds: number;
    onClose: () => void;
};

const FIELDS = ["progress", "note", "mark_finished", "ended_at"] as const;
const ALIASES = { end_page: "progress", end_percent: "progress" } as const;

export default function EndSessionForm({ session, elapsedSeconds, onClose }: Props) {
    const { t } = useTranslation(["front/reading", "front/common"]);
    const formId = useId();
    const [confirmingDiscard, setConfirmingDiscard] = useState(false);
    const [latest] = useState(() => toLocalInput(Date.now()));
    const endSession = useEndSession(session.book_id);
    const discardSession = useDiscardSession(session.book_id);
    const bounds = progressBounds(session, true);
    const needsEndTime = elapsedSeconds > READING_RULES.maxSessionHours * 3600;
    const schema = endSessionSchema(progressBounds(session, true), session.started_at, needsEndTime);

    const { handleSubmit, control, setError, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<EndSessionValues>({
        resolver: zodResolver(schema),
        mode: "onTouched",
        defaultValues: { progress: lastProgress(session), note: "", mark_finished: false, ended_at: "" },
    });
    const fieldStatus = useFieldStatus(schema, control);
    const progress = useWatch({ control, name: "progress" });
    const finishesBook = progress !== null && (bounds.usesPercent ? progress >= READING_RULES.percentMax : Boolean(session.reading.edition?.pages) && progress >= bounds.max);
    const busy = isSubmitting || discardSession.isPending;

    useEffect(() => {
        if (finishesBook) setValue("mark_finished", true);
    }, [finishesBook, setValue]);

    const submit = async (values: EndSessionValues) => {
        try {
            await endSession.mutateAsync({
                sessionId: session.id,
                data: {
                    end_page: bounds.usesPercent ? null : values.progress,
                    end_percent: bounds.usesPercent ? values.progress : null,
                    ended_at: values.ended_at ? fromLocalInput(values.ended_at) : null,
                    note: values.note || null,
                    mark_finished: values.mark_finished,
                },
            });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS, ALIASES);
        }
    };

    const discard = async () => {
        try {
            await discardSession.mutateAsync(session.id);
            onClose();
        } catch {
            return;
        }
    };

    const footer = confirmingDiscard ? (
        <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDiscard(false)} disabled={busy} className="min-h-10">{t("end.keep")}</Button>
            <Button variant="danger" size="sm" leftIcon={Trash2} onClick={discard} loading={discardSession.isPending} loadingText={t("end.discarding")} className="min-h-10">
                {t("end.discard")}
            </Button>
        </>
    ) : (
        <>
            <Button variant="menuDanger" size="sm" leftIcon={Trash2} onClick={() => setConfirmingDiscard(true)} disabled={busy} className="min-h-10 rounded-control">
                {t("end.discard")}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={busy} className="min-h-10">{t("front/common:actions.cancel")}</Button>
            <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("end.submitting")} className="min-h-10">
                {t("end.submit")}
            </Button>
        </>
    );

    return (
        <Modal
            open
            onClose={onClose}
            icon={Flag}
            title={t("end.title")}
            description={confirmingDiscard ? undefined : t("end.description")}
            dismissible={!busy}
            unsavedChanges={isDirty && !confirmingDiscard}
            footer={footer}
        >
            {confirmingDiscard ? (
                <p className="text-sm">{t("end.discardConfirm")}</p>
            ) : (
                <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                    <RequiredFieldsNote />
                    <Controller
                        name="progress"
                        control={control}
                        render={({ field }) => (
                            <NumberField
                                label={t(bounds.usesPercent ? "end.percent" : "end.page")}
                                required
                                min={bounds.min}
                                max={bounds.max}
                                decimals={bounds.usesPercent ? READING_RULES.percentDecimals : 0}
                                helperText={t(bounds.usesPercent ? "end.percentHelper" : "end.pageHelper", { min: bounds.min, max: bounds.max })}
                                error={errors.progress}
                                status={fieldStatus("progress")}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                            />
                        )}
                    />
                    {needsEndTime && (
                        <Controller
                            name="ended_at"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label={t("end.endedAt")}
                                    type="datetime-local"
                                    required
                                    min={toLocalInput(session.started_at)}
                                    max={latest}
                                    helperText={t("end.endedAtHelper")}
                                    error={errors.ended_at}
                                    status={fieldStatus("ended_at")}
                                    {...field}
                                />
                            )}
                        />
                    )}
                    <Controller
                        name="note"
                        control={control}
                        render={({ field }) => (
                            <TextAreaField
                                label={t("end.note")}
                                rows={3}
                                placeholder={t("end.notePlaceholder")}
                                maxLength={READING_RULES.noteMaxLength}
                                helperText={t("end.noteHelper")}
                                error={errors.note}
                                status={fieldStatus("note")}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="mark_finished"
                        control={control}
                        render={({ field }) => (
                            <CheckboxField
                                label={t("end.markFinished")}
                                helperText={t("end.markFinishedHelper")}
                                error={errors.mark_finished}
                                checked={field.value}
                                onChange={(event) => field.onChange(event.target.checked)}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                            />
                        )}
                    />
                </form>
            )}
        </Modal>
    );
}
