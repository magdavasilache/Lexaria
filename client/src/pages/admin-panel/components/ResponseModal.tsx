import { useEffect, useId } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquareReply } from "lucide-react";
import Modal from "../../../global-components/modal/Modal";
import Button from "../../../global-components/buttons/Button";
import SelectField from "../../../forms/components/SelectField";
import TextAreaField from "../../../forms/components/TextAreaField";
import { useFieldStatus } from "../../../forms/useFieldStatus";
import { applyFieldErrors } from "../../../forms/applyFieldErrors";
import { ResponseFormValues, responseFormSchema } from "../../../schemas/chatbotSchemas";
import { Intent } from "../../../types/chatbot-types";
import { useCreateResponse, useUpdateResponse } from "../../../api-handling/rtk-hooks/chatbot/useIntents";

export type ResponseRow = { id: number; response: string; intentId: number; intentTag: string };

type Props = {
    open: boolean;
    response: ResponseRow | null;
    intents: Intent[];
    onClose: () => void;
};

const EMPTY: ResponseFormValues = { intentId: null, response: "" };

export default function ResponseModal({ open, response, intents, onClose }: Props) {
    const { t } = useTranslation(["front/admin", "front/common"]);
    const formId = useId();
    const createResponse = useCreateResponse();
    const updateResponse = useUpdateResponse();
    const isEditing = response !== null;

    const { register, control, handleSubmit, reset, setError, formState: { errors, isDirty, isSubmitting } } = useForm<ResponseFormValues>({
        resolver: zodResolver(responseFormSchema),
        mode: "onTouched",
        defaultValues: EMPTY,
    });
    const status = useFieldStatus(responseFormSchema, control);

    const savedIntentId = response?.intentId;
    const savedText = response?.response;

    useEffect(() => {
        if (open) reset(savedIntentId !== undefined && savedText !== undefined ? { intentId: savedIntentId, response: savedText } : EMPTY);
    }, [open, savedIntentId, savedText, reset]);

    const onSubmit = async (values: ResponseFormValues) => {
        try {
            if (response) await updateResponse.mutateAsync({ responseId: response.id, data: { response: values.response } });
            else if (values.intentId !== null) await createResponse.mutateAsync({ intentId: values.intentId, data: { response: values.response } });
            reset(EMPTY);
            onClose();
        } catch (error) {
            applyFieldErrors(error, setError, ["intentId", "response"]);
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
                <TextAreaField
                    label={t("chatbot.responses.response")}
                    required
                    rows={4}
                    showCount={false}
                    helperText={t("chatbot.responses.responseHelper")}
                    error={errors.response}
                    status={status("response")}
                    {...register("response")}
                />
            </form>
        </Modal>
    );
}
