import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Trash2 } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import FieldShell from "../../../shared/forms/fields/FieldShell";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useReaderVote } from "../hooks/useReaderVote";
import { readerVoteSchema, type ReaderVoteValues } from "../schemas/bookSchemas";
import { BOOK_RULES } from "../schemas/bookRules";
import type { ReaderSignals } from "../types/bookTypes";
import { MoodChips, PaceSegments } from "./SignalPickers";

type Props = {
    bookId: number;
    title: string;
    signals: ReaderSignals;
    onClose: () => void;
};

export default function ReaderVoteModal({ bookId, title, signals, onClose }: Props) {
    const { t } = useTranslation(["front/books", "front/common"]);
    const formId = useId();
    const moodsId = useId();
    const paceId = useId();
    const { save, remove } = useReaderVote(bookId);
    const hasVote = signals.my_moods.length > 0 || signals.my_pace !== null;
    const { control, handleSubmit, setError, formState: { errors, isSubmitting, isDirty } } = useForm<ReaderVoteValues>({
        resolver: zodResolver(readerVoteSchema),
        mode: "onTouched",
        defaultValues: { moods: signals.my_moods, pace: signals.my_pace },
    });
    const busy = isSubmitting || remove.isPending;

    const submit = async (values: ReaderVoteValues) => {
        try {
            await save.mutateAsync(values);
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, ["moods", "pace"]);
        }
    };

    const removeVote = async () => {
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
            size="md"
            icon={Sparkles}
            title={t("signals.voteTitle")}
            description={t("signals.voteDescription", { title })}
            dismissible={!busy}
            unsavedChanges={isDirty}
            footer={
                <>
                    {hasVote && (
                        <Button variant="ghost" size="sm" leftIcon={Trash2} onClick={removeVote} loading={remove.isPending} loadingText={t("signals.removing")} disabled={isSubmitting} className="min-h-10 sm:mr-auto">
                            {t("signals.removeVote")}
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={busy} className="min-h-10">
                        {t("front/common:actions.cancel")}
                    </Button>
                    <Button type="submit" form={formId} size="sm" loading={isSubmitting} loadingText={t("signals.saving")} disabled={remove.isPending} className="min-h-10">
                        {t("signals.save")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-5">
                <Controller
                    name="moods"
                    control={control}
                    render={({ field }) => (
                        <FieldShell
                            as="fieldset"
                            label={t("signals.moodsLabel")}
                            helperText={t("signals.moodsHelper")}
                            error={errors.moods}
                            inputId={moodsId}
                            helperId={`${moodsId}-helper`}
                            errorId={`${moodsId}-error`}
                        >
                            <MoodChips
                                label={t("signals.moodsLabel")}
                                value={field.value}
                                max={BOOK_RULES.moodsPerVoteMax}
                                describedBy={`${moodsId}-helper`}
                                invalid={Boolean(errors.moods)}
                                onChange={(moods) => field.onChange(moods)}
                            />
                        </FieldShell>
                    )}
                />
                <Controller
                    name="pace"
                    control={control}
                    render={({ field }) => (
                        <FieldShell
                            as="fieldset"
                            label={t("signals.paceLabel")}
                            helperText={t("signals.paceHelper")}
                            error={errors.pace}
                            inputId={paceId}
                            helperId={`${paceId}-helper`}
                            errorId={`${paceId}-error`}
                        >
                            <PaceSegments
                                single
                                label={t("signals.paceLabel")}
                                value={field.value ? [field.value] : []}
                                onChange={(paces) => field.onChange(paces[0] ?? null)}
                            />
                        </FieldShell>
                    )}
                />
            </form>
        </Modal>
    );
}
