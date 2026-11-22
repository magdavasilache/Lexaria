import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Pencil, Plus } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import NumberField from "../../../shared/forms/fields/NumberField";
import RadioGroupField from "../../../shared/forms/fields/RadioGroupField";
import RequiredFieldsNote from "../../../shared/forms/fields/RequiredFieldsNote";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { NO_EDITION, StartSessionValues, editionBounds, startSessionSchema } from "../schemas/readingSchemas";
import { READING_RULES } from "../schemas/readingRules";
import { useEditions } from "../hooks/useEditions";
import { useAuthStore } from "../../auth/stores/useAuthStore";
import { USER_ROLE } from "../../auth/userTypes";
import { useStartSession } from "../hooks/useSessionMutations";
import type { Edition } from "../types/editionTypes";
import type { Reading } from "../types/readingTypes";
import { useReadingFormat } from "../hooks/useReadingFormat";

type Props = {
    bookId: number;
    reading: Reading | null;
    preselectedId: number | null;
    onAddEdition: () => void;
    onEditEdition: (edition: Edition) => void;
    onClose: () => void;
};

const FIELDS = ["edition", "progress"] as const;
const ALIASES = { edition_id: "edition", start_page: "progress", start_percent: "progress" } as const;

export default function EditionPicker({ bookId, reading, preselectedId, onAddEdition, onEditEdition, onClose }: Props) {
    const { data: editions, isLoading } = useEditions(bookId);
    return (
        <EditionPickerForm
            key={isLoading ? "loading" : "ready"}
            bookId={bookId}
            reading={reading}
            editions={editions ?? []}
            loading={isLoading}
            preselectedId={preselectedId}
            onAddEdition={onAddEdition}
            onEditEdition={onEditEdition}
            onClose={onClose}
        />
    );
}

function EditionPickerForm({ bookId, reading, editions, loading, preselectedId, onAddEdition, onEditEdition, onClose }: Props & { editions: Edition[]; loading: boolean }) {
    const { t } = useTranslation(["front/reading", "front/common"]);
    const format = useReadingFormat();
    const formId = useId();
    const startSession = useStartSession();
    const user = useAuthStore((state) => state.user);
    const canEdit = (edition: Edition) => Boolean(user && (edition.created_by_id === user.id || user.role === USER_ROLE.ADMIN));
    const schema = startSessionSchema(editions);
    const find = (value: string) => editions.find((edition) => String(edition.id) === value) ?? null;

    const { handleSubmit, control, register, setValue, setError, formState: { errors, isSubmitting } } = useForm<StartSessionValues>({
        resolver: zodResolver(schema),
        mode: "onTouched",
        defaultValues: {
            edition: preselectedId !== null ? String(preselectedId) : "",
            progress: reading?.current_page ?? null,
        },
    });
    const fieldStatus = useFieldStatus(schema, control);
    const selected = useWatch({ control, name: "edition" });
    const bounds = editionBounds(find(selected));

    const editionField = register("edition", {
        onChange: (event: { target: { value: string } }) => {
            if (editionBounds(find(event.target.value)).usesPercent !== bounds.usesPercent) setValue("progress", null);
        },
    });

    const options = [
        ...editions.map((edition) => ({
            value: String(edition.id),
            label: format.editionTitle(edition),
            description: format.editionDetails(edition) || undefined,
            action: canEdit(edition) ? (
                <Button
                    variant="ghost"
                    size="sm"
                    icon={Pencil}
                    aria-label={t("picker.editEdition", { edition: format.editionTitle(edition) })}
                    onClick={() => onEditEdition(edition)}
                    disabled={isSubmitting}
                    className="h-10 w-10"
                />
            ) : undefined,
        })),
        { value: NO_EDITION, label: t("picker.noEdition"), description: t("picker.noEditionHelper") },
    ];

    const submit = async (values: StartSessionValues) => {
        const edition = find(values.edition);
        const usesPercent = editionBounds(edition).usesPercent;
        try {
            await startSession.mutateAsync({
                bookId,
                data: {
                    edition_id: edition?.id ?? null,
                    start_page: usesPercent ? null : values.progress,
                    start_percent: usesPercent ? values.progress : null,
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
            size="lg"
            icon={BookOpen}
            title={t("picker.title")}
            description={t("picker.description")}
            dismissible={!isSubmitting}
            footer={
                <>
                    <Button variant="ghost" size="sm" leftIcon={Plus} onClick={onAddEdition} disabled={isSubmitting} className="min-h-10">
                        {t("picker.addEdition")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting} className="min-h-10">
                        {t("front/common:actions.cancel")}
                    </Button>
                    <Button type="submit" form={formId} size="sm" disabled={loading} loading={isSubmitting} loadingText={t("start.starting")} className="min-h-10">
                        {t("picker.submit")}
                    </Button>
                </>
            }
        >
            {loading ? (
                <p role="status" className="py-6 text-center text-sm text-fontMutedLight dark:text-fontMutedDark">{t("picker.loading")}</p>
            ) : (
                <form id={formId} noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                    <RequiredFieldsNote />
                    <RadioGroupField
                        label={t("picker.edition")}
                        required
                        layout="cards"
                        options={options}
                        helperText={editions.length === 0 ? t("picker.empty") : undefined}
                        error={errors.edition}
                        status={fieldStatus("edition")}
                        {...editionField}
                    />
                    <Controller
                        name="progress"
                        control={control}
                        render={({ field }) => (
                            <NumberField
                                label={t(bounds.usesPercent ? "picker.startPercent" : "picker.startPage")}
                                min={bounds.min}
                                max={bounds.max}
                                decimals={bounds.usesPercent ? READING_RULES.percentDecimals : 0}
                                helperText={t(bounds.usesPercent ? "picker.startPercentHelper" : "picker.startPageHelper", { max: bounds.max })}
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
