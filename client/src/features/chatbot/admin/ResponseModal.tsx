import { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareReply } from "lucide-react";
import Modal from "../../../shared/components/modal/Modal";
import Button from "../../../shared/components/Button";
import SelectField from "../../../shared/forms/fields/SelectField";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { ResponseFormValues, responseFormSchema } from "../schemas/chatbotSchemas";
import { CHATBOT_RULES, RESPONSE_LANGUAGES } from "../schemas/chatbotRules";
import { currentLanguage } from "../../../i18n";
import { Intent, ResponseLanguage } from "../chatbotTypes";
import { useSaveResponse } from "../hooks/useChatbot";

export type ResponseRow = { id: number; response: string; language: ResponseLanguage; intentId: number; intentTag: string };

type Props = {
    open: boolean;
    response: ResponseRow | null;
    intents: Intent[];
    onClose: () => void;
};

const empty = (): ResponseFormValues => ({ intentId: null, language: currentLanguage(), response: "" });

export default function ResponseModal({ open, response, intents, onClose }: Props) {
    const { t } = useTranslation(["front/admin", "front/common"]);
    const formId = useId();
    const saveResponse = useSaveResponse();
    const isEditing = response !== null;

    const { register, control, handleSubmit, reset, setError, formState: { errors, isDirty, isSubmitting } } = useForm<ResponseFormValues>({
        resolver: zodResolver(responseFormSchema),
        mode: "onTouched",
        defaultValues: empty(),
    });
    const status = useFieldStatus(responseFormSchema, control);

    const savedIntentId = response?.intentId;
    const savedText = response?.response;
    const savedLanguage = response?.language;
    const selectedIntentId = useWatch({ control, name: "intentId" });
    const handled = intents.find((intent) => intent.id === (response?.intentId ?? selectedIntentId))?.handled ?? false;

    useEffect(() => {
        if (open) {
            reset(
                savedIntentId !== undefined && savedText !== undefined && savedLanguage !== undefined
                    ? { intentId: savedIntentId, language: savedLanguage, response: savedText }
                    : empty()
            );
        }
    }, [open, savedIntentId, savedText, savedLanguage, reset]);

    const onSubmit = async (values: ResponseFormValues) => {
        try {
            const intentId = response?.intentId ?? values.intentId;
            if (intentId === null) return;
            await saveResponse.mutateAsync({ id: response?.id ?? null, intentId, data: { response: values.response, language: values.language } });
            reset(empty());
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, ["intentId", "language", "response"]);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            icon={MessageSquareReply}
            title={t(isEditing ? "chatbot.responses.editTitle" : "chatbot.responses.addTitle")}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>{t("front/common:actions.cancel")}</Button>
                    <Button
                        type="submit"
                        form={formId}
                        size="sm"
                        disabled={isEditing && !isDirty}
                        loading={isSubmitting}
                        loadingText={t(isEditing ? "chatbot.responses.saving" : "chatbot.responses.creating")}
                    >
                        {t(isEditing ? "chatbot.responses.save" : "chatbot.responses.create")}
                    </Button>
                </>
            }
        >
            <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Controller
                    control={control}
                    name="intentId"
                    render={({ field }) => (
                        <SelectField
                            label={t("chatbot.responses.intent")}
                            required
                            disabled={isEditing}
                            helperText={isEditing ? t("chatbot.responses.intentLocked") : undefined}
                            placeholder={t("chatbot.responses.selectIntent")}
                            error={errors.intentId}
                            status={isEditing ? "neutral" : status("intentId")}
                            value={field.value}
                            options={intents.map((intent) => ({ value: intent.id, label: intent.tag }))}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                        />
                    )}
                />
                <Controller
                    control={control}
                    name="language"
                    render={({ field }) => (
                        <SelectField
                            label={t("chatbot.responses.language")}
                            required
                            helperText={t("chatbot.responses.languageHelper")}
                            error={errors.language}
                            status={status("language")}
                            value={field.value}
                            options={RESPONSE_LANGUAGES.map((language) => ({ value: language, label: t(`chatbot.responses.languages.${language}`) }))}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                        />
                    )}
                />
                {handled && <p role="note" className="rounded-control bg-infoLightTone px-3 py-2 text-sm text-infoTextLight dark:bg-infoDarkTone dark:text-infoTextDark">{t("chatbot.responses.handledNote")}</p>}
                <TextAreaField
                    label={t("chatbot.responses.response")}
                    required
                    rows={4}
                    showCount
                    helperText={t("chatbot.responses.responseHelper")}
                    maxLength={CHATBOT_RULES.responseMaxLength}
                    error={errors.response}
                    status={status("response")}
                    {...register("response")}
                />
            </form>
        </Modal>
    );
}
