import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilLine, Trash2 } from "lucide-react";
import Button from "../global-components/buttons/Button";
import Modal from "../global-components/modal/Modal";
import FormField from "./components/FormField";
import NumberField from "./components/NumberField";
import RequiredFieldsNote from "./components/RequiredFieldsNote";
import SelectField from "./components/SelectField";
import { applyFieldErrors } from "./applyFieldErrors";
import { useFieldStatus } from "./useFieldStatus";
import { NO_EDITION, ReadingEditValues, editionBounds, readingEditSchema } from "../schemas/readingSchemas";
import { READING_RULES } from "../schemas/readingRules";
import { useEditions } from "../api-handling/rtk-hooks/reading/useEditions";
import { useDeleteReading, useUpdateReading } from "../api-handling/rtk-hooks/reading/useJourney";
import type { Edition } from "../types/reading-types/editionTypes";
import type { Reading } from "../types/reading-types/readingTypes";
import { fromLocalInput, toLocalInput } from "../utils/dates";
import { useReadingFormat } from "../utils/useReadingFormat";

type Props = {
    reading: Reading;
    onClose: () => void;
};

const FIELDS = ["edition", "started_at", "finished_at", "progress"] as const;
const ALIASES = { edition_id: "edition", current_page: "progress", current_percent: "progress" } as const;

export default function ReadingEditForm({ reading, onClose }: Props) {
    const { data: editions, isLoading } = useEditions(reading.book_id);
    if (isLoading) return null;
    return <ReadingEditFormBody reading={reading} editions={editions ?? []} onClose={onClose} />;
}

function ReadingEditFormBody({ reading, editions, onClose }: Props & { editions: Edition[] }) {
    const { t } = useTranslation(["front/reading", "front/common"]);
    const format = useReadingFormat();
    const formId = useId();
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const updateReading = useUpdateReading(reading.book_id);
    const deleteReading = useDeleteReading(reading.book_id);
    const isActive = reading.state === "active";
    const schema = useMemo(() => readingEditSchema(editions, isActive), [editions, isActive]);
    const find = (value: string) => editions.find((edition) => String(edition.id) === value) ?? null;

    const { handleSubmit, control, setValue, setError, formState: { errors, isSubmitting, isDirty } } = useForm<ReadingEditValues>({
        resolver: zodResolver(schema),
        mode: "onTouched",
        defaultValues: {
            edition: reading.edition_id !== null ? String(reading.edition_id) : NO_EDITION,
            started_at: toLocalInput(reading.started_at),
            finished_at: reading.finished_at ? toLocalInput(reading.finished_at) : "",
            progress: reading.current_percent ?? reading.current_page,
        },
    });
    const fieldStatus = useFieldStatus(schema, control);
    const selected = useWatch({ control, name: "edition" });
    const bounds = editionBounds(find(selected));
    const busy = isSubmitting || deleteReading.isPending;

    const options = [
        { value: NO_EDITION, label: t("readingForm.noEdition") },
        ...editions.map((edition) => ({ value: String(edition.id), label: format.editionTitle(edition) })),
    ];

    const changeEdition = (value: string, onChange: (value: string) => void) => {
        if (editionBounds(find(value)).usesPercent !== bounds.usesPercent) setValue("progress", null);
        onChange(value);
    };

    const submit = async (values: ReadingEditValues) => {
        const edition = find(values.edition);
        const usesPercent = editionBounds(edition).usesPercent;
        try {
            await updateReading.mutateAsync({
                readingId: reading.id,
                data: {
                    edition_id: edition?.id ?? null,
                    started_at: fromLocalInput(values.started_at),
                    finished_at: values.finished_at ? fromLocalInput(values.finished_at) : null,
                    current_page: usesPercent ? null : values.progress,
                    current_percent: usesPercent ? values.progress : null,
                },
            });
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, FIELDS, ALIASES);
        }
    };

    const remove = async () => {
        try {
            await deleteReading.mutateAsync(reading.id);
            onClose();
        } catch {
            return;
        }
    };

    const footer = confirmingDelete ? (
        <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={busy} className="min-h-10">{t("readingForm.keep")}</Button>
            <Button variant="danger" size="sm" leftIcon={Trash2} onClick={remove} loading={deleteReading.isPending} loadingText={t("readingForm.deleting")} className="min-h-10">
                {t("readingForm.delete")}
            </Button>
        </>
    ) : (
        <>
            <Button variant="menuDanger" size="sm" leftIcon={Trash2} onClick={() => setConfirmingDelete(true)} disabled={busy} className="min-h-10 rounded-control">
                {t("readingForm.delete")}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={busy} className="min-h-10">{t("front/common:actions.cancel")}</Button>
            <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("readingForm.submitting")} className="min-h-10">
                {t("readingForm.submit")}
            </Button>
        </>
    );

    return (
        <Modal
            open
            onClose={onClose}
            icon={PencilLine}
            title={t("readingForm.title")}
            description={confirmingDelete ? undefined : t("readingForm.description")}
            dismissible={!busy}
            unsavedChanges={isDirty && !confirmingDelete}
            footer={footer}
        >
            {confirmingDelete ? (
                <p className="text-sm">{t("readingForm.deleteConfirm")}</p>
            ) : (
                <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                    <RequiredFieldsNote />
                    <Controller
                        name="edition"
                        control={control}
                        render={({ field }) => (
                            <SelectField
                                label={t("readingForm.edition")}
                                options={options}
                                helperText={t("readingForm.editionHelper")}
                                error={errors.edition}
                                status={fieldStatus("edition")}
                                value={field.value}
                                onChange={(value) => changeEdition(value, field.onChange)}
                                onBlur={field.onBlur}
                                ref={field.ref}
                            />
                        )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                            name="started_at"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label={t("readingForm.startedAt")}
                                    type="datetime-local"
                                    required
                                    max={toLocalInput(Date.now())}
                                    error={errors.started_at}
                                    status={fieldStatus("started_at")}
                                    {...field}
                                />
                            )}
                        />
                        {!isActive && (
                            <Controller
                                name="finished_at"
                                control={control}
                                render={({ field }) => (
                                    <FormField
                                        label={t(reading.state === "finished" ? "readingForm.finishedAt" : "readingForm.stoppedAt")}
                                        type="datetime-local"
                                        required
                                        max={toLocalInput(Date.now())}
                                        error={errors.finished_at}
                                        status={fieldStatus("finished_at")}
                                        {...field}
                                    />
                                )}
                            />
                        )}
                    </div>
                    <Controller
                        name="progress"
                        control={control}
                        render={({ field }) => (
                            <NumberField
                                label={t(bounds.usesPercent ? "readingForm.percent" : "readingForm.page")}
                                min={bounds.min}
                                max={bounds.max}
                                decimals={bounds.usesPercent ? READING_RULES.percentDecimals : 0}
                                helperText={t(bounds.usesPercent ? "readingForm.percentHelper" : "readingForm.pageHelper", { max: bounds.max })}
                                error={errors.progress}
                                status={fieldStatus("progress")}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                            />
                        )}
                    />
                </form>
            )}
        </Modal>
    );
}
