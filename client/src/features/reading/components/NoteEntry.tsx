import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2 } from "lucide-react";
import Button from "../../../shared/components/Button";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { NoteContentValues, noteContentSchema } from "../schemas/readingSchemas";
import { READING_RULES } from "../schemas/readingRules";
import { useDeleteNote, useUpdateNote } from "../hooks/useJourney";
import type { ReadingEvent } from "../types/readingTypes";

type Mode = "view" | "edit" | "confirmDelete";

export default function NoteEntry({ bookId, note, meta }: { bookId: number; note: ReadingEvent; meta: string }) {
    const { t } = useTranslation(["front/reading", "front/common"]);
    const [mode, setMode] = useState<Mode>("view");
    const deleteNote = useDeleteNote(bookId);

    if (mode === "edit") return <NoteEditor bookId={bookId} note={note} onDone={() => setMode("view")} />;

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 whitespace-pre-line break-words text-sm">{note.content}</p>
                {mode === "view" && (
                    <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="sm" icon={Pencil} aria-label={t("journey.editNote")} onClick={() => setMode("edit")} className="h-10 w-10" />
                        <Button variant="ghost" size="sm" icon={Trash2} aria-label={t("journey.deleteNote")} onClick={() => setMode("confirmDelete")} className="h-10 w-10" />
                    </div>
                )}
            </div>
            <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{meta}</p>
            {mode === "confirmDelete" && (
                <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="flex-1">{t("journey.deleteNoteConfirm")}</span>
                    <Button variant="ghost" size="sm" onClick={() => setMode("view")} disabled={deleteNote.isPending} className="min-h-10">
                        {t("journey.keepNote")}
                    </Button>
                    <Button variant="danger" size="sm" leftIcon={Trash2} loading={deleteNote.isPending} onClick={() => deleteNote.mutate(note.id)} className="min-h-10">
                        {t("journey.deleteNote")}
                    </Button>
                </div>
            )}
        </div>
    );
}

function NoteEditor({ bookId, note, onDone }: { bookId: number; note: ReadingEvent; onDone: () => void }) {
    const { t } = useTranslation(["front/reading", "front/common"]);
    const updateNote = useUpdateNote(bookId);
    const { handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<NoteContentValues>({
        resolver: zodResolver(noteContentSchema),
        mode: "onTouched",
        defaultValues: { content: note.content ?? "" },
    });
    const fieldStatus = useFieldStatus(noteContentSchema, control);

    const submit = async (values: NoteContentValues) => {
        try {
            await updateNote.mutateAsync({ noteId: note.id, data: { content: values.content, page: note.page, percent: note.percent } });
            onDone();
        } catch (error) {
            applyFieldErrors(error, setError, ["content"]);
        }
    };

    return (
        <form noValidate onSubmit={handleSubmit(submit)} className="flex min-w-0 flex-1 flex-col gap-2">
            <Controller
                name="content"
                control={control}
                render={({ field }) => (
                    <TextAreaField
                        label={t("journey.noteLabel")}
                        hideLabel
                        required
                        rows={3}
                        autoFocus
                        maxLength={READING_RULES.noteMaxLength}
                        error={errors.content}
                        status={fieldStatus("content")}
                        {...field}
                    />
                )}
            />
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={onDone} disabled={isSubmitting} className="min-h-10">{t("front/common:actions.cancel")}</Button>
                <Button type="submit" size="sm" loading={isSubmitting} loadingText={t("note.submitting")} className="min-h-10">{t("journey.saveNote")}</Button>
            </div>
        </form>
    );
}
