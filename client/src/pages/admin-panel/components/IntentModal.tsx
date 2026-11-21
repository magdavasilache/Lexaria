import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, MessageSquareText, Pencil, Plus, Trash2, X } from "lucide-react";
import Modal from "../../../global-components/modal/Modal";
import Button from "../../../global-components/buttons/Button";
import FormField from "../../../forms/components/FormField";
import SelectField from "../../../forms/components/SelectField";
import { useFieldStatus } from "../../../forms/useFieldStatus";
import { applyFieldErrors } from "../../../forms/applyFieldErrors";
import { IntentFormValues, PatternFormValues, intentFormSchema, patternFormSchema } from "../../../schemas/chatbotSchemas";
import { INTENT_TYPES } from "../../../schemas/chatbotRules";
import { Intent } from "../../../types/chatbot-types";
import { useCreateIntent, useCreatePattern, useDeletePattern, useUpdateIntent, useUpdatePattern } from "../../../api-handling/rtk-hooks/chatbot/useIntents";

type Props = {
    open: boolean;
    intent: Intent | null;
    onClose: () => void;
    onCreated: (intent: Intent) => void;
};

const EMPTY_INTENT: IntentFormValues = { tag: "", type: "informational" };
const PATTERN_ICON_BUTTON = "min-h-10 min-w-10 justify-center";

export default function IntentModal({ open, intent, onClose, onCreated }: Props) {
    const { t } = useTranslation(["front/admin", "front/common"]);
    const formId = useId();
    const createIntent = useCreateIntent();
    const updateIntent = useUpdateIntent();

    const { register, control, handleSubmit, reset, setError, formState: { errors, isDirty, isSubmitting } } = useForm<IntentFormValues>({
        resolver: zodResolver(intentFormSchema),
        mode: "onTouched",
        defaultValues: EMPTY_INTENT,
    });
    const status = useFieldStatus(intentFormSchema, control);

    const savedTag = intent?.tag;
    const savedType = intent?.type;

    useEffect(() => {
        if (open) reset(savedTag && savedType ? { tag: savedTag, type: savedType } : EMPTY_INTENT);
    }, [open, savedTag, savedType, reset]);

    const onSubmit = async (values: IntentFormValues) => {
        try {
            if (intent) {
                await updateIntent.mutateAsync({ id: intent.id, data: values });
                reset(values);
            } else {
                const created = await createIntent.mutateAsync(values);
                reset({ tag: created.tag, type: created.type });
                onCreated(created);
            }
        } catch (error) {
            applyFieldErrors(error, setError, ["tag", "type"]);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="lg"
            icon={MessageSquareText}
            title={t(intent ? "chatbot.intents.editTitle" : "chatbot.intents.addTitle")}
            dismissible={!isSubmitting}
            unsavedChanges={isDirty}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>{t("front/common:actions.cancel")}</Button>
                    <Button
                        type="submit"
                        form={formId}
                        size="sm"
                        disabled={Boolean(intent) && !isDirty}
                        loading={isSubmitting}
                        loadingText={t(intent ? "chatbot.intents.saving" : "chatbot.intents.creating")}
                    >
                        {t(intent ? "chatbot.intents.save" : "chatbot.intents.create")}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        label={t("chatbot.intents.tag")}
                        required
                        helperText={t("chatbot.intents.tagHelper")}
                        error={errors.tag}
                        status={status("tag")}
                        {...register("tag")}
                    />
                    <Controller
                        control={control}
                        name="type"
                        render={({ field }) => (
                            <SelectField
                                label={t("chatbot.intents.type")}
                                required
                                error={errors.type}
                                status={status("type")}
                                value={field.value}
                                options={INTENT_TYPES.map((type) => ({ value: type, label: t(`chatbot.intents.types.${type}`) }))}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                            />
                        )}
                    />
                </form>

                <section className="flex flex-col gap-3 border-t border-dividerLight pt-4 dark:border-dividerDark">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
                        {t("chatbot.intents.patternsHeading", { count: intent?.patterns.length ?? 0 })}
                    </h3>
                    {intent ? (
                        <>
                            {intent.patterns.length === 0 ? (
                                <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("chatbot.intents.noPatterns")}</p>
                            ) : (
                                <ul className="flex flex-col divide-y divide-panelBorderLight overflow-hidden rounded-panel border border-panelBorderLight bg-panelLight dark:divide-panelBorderDark dark:border-panelBorderDark dark:bg-panelDark">
                                    {intent.patterns.map((pattern) => <PatternItem key={pattern.id} pattern={pattern} />)}
                                </ul>
                            )}
                            <NewPatternForm intentId={intent.id} />
                        </>
                    ) : (
                        <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("chatbot.intents.patternsAfterCreate")}</p>
                    )}
                </section>
            </div>
        </Modal>
    );
}

function PatternItem({ pattern }: { pattern: { id: number; pattern: string } }) {
    const { t } = useTranslation("front/admin");
    const [editing, setEditing] = useState(false);
    const updatePattern = useUpdatePattern();
    const deletePattern = useDeletePattern();

    const { register, control, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<PatternFormValues>({
        resolver: zodResolver(patternFormSchema),
        mode: "onTouched",
        defaultValues: { pattern: pattern.pattern },
    });
    const status = useFieldStatus(patternFormSchema, control);

    const cancel = () => {
        reset({ pattern: pattern.pattern });
        setEditing(false);
    };

    const onSubmit = async (values: PatternFormValues) => {
        if (values.pattern === pattern.pattern) return cancel();
        try {
            await updatePattern.mutateAsync({ patternId: pattern.id, data: values });
            reset(values);
            setEditing(false);
        } catch (error) {
            applyFieldErrors(error, setError, ["pattern"]);
        }
    };

    if (editing) {
        return (
            <li className="px-2 py-1.5">
                <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-1">
                    <div className="min-w-0 flex-1">
                        <FormField
                            label={t("chatbot.intents.pattern")}
                            hideLabel
                            autoFocus
                            error={errors.pattern}
                            status={status("pattern")}
                            onKeyDown={(event) => event.key === "Escape" && (event.stopPropagation(), cancel())}
                            {...register("pattern")}
                        />
                    </div>
                    <Button type="submit" variant="ghost" size="sm" icon={Check} aria-label={t("chatbot.intents.savePattern")} loading={isSubmitting} className={PATTERN_ICON_BUTTON} />
                    <Button variant="ghost" size="sm" icon={X} aria-label={t("chatbot.intents.cancelEdit")} onClick={cancel} disabled={isSubmitting} className={PATTERN_ICON_BUTTON} />
                </form>
            </li>
        );
    }

    return (
        <li className="flex items-center gap-1 py-0.5 pl-3 pr-1 text-sm">
            <span className="min-w-0 flex-1 break-words">{pattern.pattern}</span>
            <Button variant="ghost" size="sm" icon={Pencil} aria-label={t("chatbot.intents.editPattern", { label: pattern.pattern })} onClick={() => setEditing(true)} className={PATTERN_ICON_BUTTON} />
            <Button
                variant="menuDanger"
                size="sm"
                icon={Trash2}
                aria-label={t("chatbot.intents.deletePattern", { label: pattern.pattern })}
                loading={deletePattern.isPending}
                onClick={() => deletePattern.mutate(pattern.id)}
                className={PATTERN_ICON_BUTTON}
            />
        </li>
    );
}

function NewPatternForm({ intentId }: { intentId: number }) {
    const { t } = useTranslation("front/admin");
    const createPattern = useCreatePattern();
    const { register, control, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<PatternFormValues>({
        resolver: zodResolver(patternFormSchema),
        mode: "onTouched",
        defaultValues: { pattern: "" },
    });
    const status = useFieldStatus(patternFormSchema, control);

    const onSubmit = async (values: PatternFormValues) => {
        try {
            await createPattern.mutateAsync({ intentId, data: values });
            reset({ pattern: "" });
        } catch (error) {
            applyFieldErrors(error, setError, ["pattern"]);
        }
    };

    return (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
                <FormField
                    label={t("chatbot.intents.newPattern")}
                    hideLabel
                    placeholder={t("chatbot.intents.newPatternPlaceholder")}
                    error={errors.pattern}
                    status={status("pattern")}
                    {...register("pattern")}
                />
            </div>
            <Button type="submit" variant="secondary" size="sm" leftIcon={Plus} loading={isSubmitting} className="min-h-10 shrink-0">
                {t("chatbot.intents.addPattern")}
            </Button>
        </form>
    );
}
