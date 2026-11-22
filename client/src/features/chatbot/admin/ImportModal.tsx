import { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileJson, Upload } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import FormField from "../../../shared/forms/fields/FormField";
import RadioGroupField from "../../../shared/forms/fields/RadioGroupField";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";
import { CHATBOT_RULES, IMPORT_MODES } from "../schemas/chatbotRules";
import { IntentImportValues, intentImportSchema } from "../schemas/chatbotSchemas";
import type { IntentImport } from "../chatbotTypes";
import { useImportIntents } from "../hooks/useChatbot";

const ACCEPT = `${CHATBOT_RULES.importFileExtension},application/json`;
const SUCCESS_DURATION_MS = 6000;

const readIntents = async (file: File): Promise<IntentImport["intents"] | null> => {
    try {
        const parsed: unknown = JSON.parse(await file.text());
        return Array.isArray(parsed) ? (parsed as IntentImport["intents"]) : null;
    } catch {
        return null;
    }
};

export default function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { t, i18n } = useTranslation(["front/admin", "front/common"]);
    const formId = useId();
    const importIntents = useImportIntents();
    const showSnackBar = useSnackbarStore((state) => state.showSnackBar);
    const number = new Intl.NumberFormat(i18n.resolvedLanguage);

    const { register, control, handleSubmit, reset, setError, formState: { errors, isDirty, isSubmitting } } = useForm<IntentImportValues>({
        resolver: zodResolver(intentImportSchema),
        mode: "onTouched",
        defaultValues: { mode: "merge" },
    });
    const status = useFieldStatus(intentImportSchema, control);

    useEffect(() => {
        if (open) reset({ mode: "merge" });
    }, [open, reset]);

    const onSubmit = async (values: IntentImportValues) => {
        const intents = await readIntents(values.file[0]);
        if (intents === null) {
            setError("file", { type: "parse", message: "front/admin:chatbot.validation.importJson" }, { shouldFocus: true });
            return;
        }
        try {
            const summary = await importIntents.mutateAsync({ intents, replace: values.mode === "replace" });
            showSnackBar(
                t("chatbot.import.done", {
                    intents: number.format(summary.intents),
                    patterns: number.format(summary.patterns),
                    responses: number.format(summary.responses),
                }),
                "success",
                SUCCESS_DURATION_MS
            );
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, ["file"], { intents: "file" });
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="md"
            icon={Upload}
            title={t("chatbot.import.title")}
            description={t("chatbot.import.description")}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>{t("front/common:actions.cancel")}</Button>
                    <Button type="submit" form={formId} size="sm" leftIcon={Upload} loading={isSubmitting} loadingText={t("chatbot.import.submitting")}>
                        {t("chatbot.import.submit")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <FormField
                    type="file"
                    accept={ACCEPT}
                    label={t("chatbot.import.file")}
                    leftIcon={FileJson}
                    required
                    helperText={t("chatbot.import.fileHelper", { max: CHATBOT_RULES.importFileMaxMb })}
                    error={errors.file}
                    status={status("file")}
                    className="file:mr-3 file:border-0 file:bg-transparent file:font-semibold file:text-primaryLight dark:file:text-primaryDark"
                    {...register("file")}
                />
                <RadioGroupField
                    label={t("chatbot.import.mode")}
                    required
                    options={IMPORT_MODES.map((mode) => ({
                        value: mode,
                        label: t(`chatbot.import.modes.${mode}`),
                        description: t(`chatbot.import.modes.${mode}Hint`),
                    }))}
                    error={errors.mode}
                    status={status("mode")}
                    {...register("mode")}
                />
                <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("chatbot.import.rebuildNote")}</p>
            </form>
        </Modal>
    );
}
