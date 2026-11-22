import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NotebookPen } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import NumberField from "../../../shared/forms/fields/NumberField";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { SessionNoteValues, sessionNoteSchema } from "../schemas/readingSchemas";
import { READING_RULES } from "../schemas/readingRules";
import { useAddNote } from "../hooks/useSessionMutations";
import type { ActiveSession } from "../types/readingTypes";
import { progressBounds } from "./progress";

type Props = {
    session: ActiveSession;
    onClose: () => void;
};

const FIELDS = ["content", "progress"] as const;
const ALIASES = { page: "progress", percent: "progress" } as const;

export default function SessionNoteForm({ session, onClose }: Props) {
    const { t } = useTranslation(["front/reading", "front/common"]);
    const formId = useId();
    const addNote = useAddNote(session.book_id);
    const bounds = progressBounds(session, false);
    const schema = sessionNoteSchema(progressBounds(session, false));

    const { handleSubmit, control, setError, formState: { errors, isSubmitting, isDirty } } = useForm<SessionNoteValues>({
        resolver: zodResolver(schema),
        mode: "onTouched",
        defaultValues: { content: "", progress: null },
    });
    const fieldStatus = useFieldStatus(schema, control);

    const submit = async (values: SessionNoteValues) => {
        try {
            await addNote.mutateAsync({
                readingId: session.reading_id,
                data: {
                    content: values.content,
                    page: bounds.usesPercent ? null : values.progress,
                    percent: bounds.usesPercent ? values.progress : null,
                    session_id: session.id,
                },
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
            icon={NotebookPen}
            title={t("note.title")}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="min-h-10">{t("front/common:actions.cancel")}</Button>
                    <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("note.submitting")} className="min-h-10">
                        {t("note.submit")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <RequiredFieldsNote />
                <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                        <TextAreaField
                            label={t("note.content")}
                            required
                            rows={4}
                            placeholder={t("note.contentPlaceholder")}
                            maxLength={READING_RULES.noteMaxLength}
                            helperText={t("note.contentHelper")}
                            error={errors.content}
                            status={fieldStatus("content")}
                            {...field}
                        />
                    )}
                />
                <Controller
                    name="progress"
                    control={control}
                    render={({ field }) => (
                        <NumberField
                            label={t(bounds.usesPercent ? "note.percent" : "note.page")}
                            min={bounds.min}
                            max={bounds.max}
                            decimals={bounds.usesPercent ? READING_RULES.percentDecimals : 0}
                            helperText={t(bounds.usesPercent ? "note.percentHelper" : "note.pageHelper", { max: bounds.max })}
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
        </Modal>
    );
}
