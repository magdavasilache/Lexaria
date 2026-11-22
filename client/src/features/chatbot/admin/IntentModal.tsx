import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, MessageSquareText, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react";
import Modal from "../../../shared/components/modal/Modal";
import Button from "../../../shared/components/Button";
import FormField from "../../../shared/forms/fields/FormField";
import SelectField from "../../../shared/forms/fields/SelectField";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { IntentFormValues, PatternFormValues, intentFormSchema, patternFormSchema } from "../schemas/chatbotSchemas";
import { CHATBOT_RULES, INTENT_TYPES } from "../schemas/chatbotRules";
import { Intent, Pattern, PatternOverlap } from "../chatbotTypes";
import { useCreatePattern, useDeletePattern, useIntentOverlaps, useSaveIntent, useUpdatePattern } from "../hooks/useChatbot";

type Props = {
    open: boolean;
    intent: Intent | null;
    onClose: () => void;
    onCreated: (intent: Intent) => void;
};

const EMPTY_INTENT: IntentFormValues = { tag: "", type: "informational" };
const PATTERN_ICON_BUTTON = "min-h-10 min-w-10 justify-center";

const groupByPattern = (overlaps: PatternOverlap[]) => {
    const grouped = new Map<number, PatternOverlap[]>();
    overlaps.forEach((overlap) => grouped.set(overlap.pattern_id, [...(grouped.get(overlap.pattern_id) ?? []), overlap]));
    return grouped;
};

export default function IntentModal({ open, intent, onClose, onCreated }: Props) {
    const { t } = useTranslation(["front/admin", "front/common"]);
    const formId = useId();
    const saveIntent = useSaveIntent();
    const overlaps = useIntentOverlaps(intent?.id ?? null);
    const overlapsByPattern = groupByPattern(overlaps.data ?? []);

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
            const saved = await saveIntent.mutateAsync({ id: intent?.id ?? null, data: values });
            reset({ tag: saved.tag, type: saved.type });
            if (!intent) onCreated(saved);
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
                        maxLength={CHATBOT_RULES.tagMaxLength}
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
                            {overlapsByPattern.size > 0 && (
                                <p role="status" className="flex items-start gap-2 rounded-control bg-warningLightTone px-3 py-2 text-xs text-warningTextLight dark:bg-warningDarkTone dark:text-warningTextDark">
                                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                                    <span>{t("chatbot.intents.overlapSummary", { count: overlapsByPattern.size })}</span>
                                </p>
                            )}
                            {intent.patterns.length === 0 ? (
                                <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("chatbot.intents.noPatterns")}</p>
                            ) : (
                                <ul className="flex flex-col divide-y divide-panelBorderLight overflow-hidden rounded-panel border border-panelBorderLight bg-panelLight dark:divide-panelBorderDark dark:border-panelBorderDark dark:bg-panelDark">
                                    {intent.patterns.map((pattern) => <PatternItem key={pattern.id} pattern={pattern} overlaps={overlapsByPattern.get(pattern.id) ?? []} />)}
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

function OverlapNotes({ overlaps }: { overlaps: PatternOverlap[] }) {
    const { t, i18n } = useTranslation("front/admin");
    const percent = new Intl.NumberFormat(i18n.resolvedLanguage, { style: "percent", maximumFractionDigits: 0 });
    return (
        <ul className="flex flex-col gap-0.5">
            {overlaps.map((overlap) => (
                <li key={overlap.other_pattern_id} className="flex items-start gap-1 text-xs text-warningTextLight dark:text-warningTextDark">
                    <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="break-words">
                        {t("chatbot.intents.overlap", { pattern: overlap.other_pattern, tag: overlap.other_tag, value: percent.format(overlap.similarity) })}
                    </span>
                </li>
            ))}
        </ul>
    );
}

function PatternItem({ pattern, overlaps }: { pattern: Pattern; overlaps: PatternOverlap[] }) {
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
            await updatePattern.mutateAsync({ id: pattern.id, data: values });
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
                            maxLength={CHATBOT_RULES.patternMaxLength}
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
        <li className={`flex items-center gap-1 py-0.5 pl-3 pr-1 text-sm ${overlaps.length > 0 ? "bg-warningLightTone/40 dark:bg-warningDarkTone/40" : ""}`}>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-1">
                <span className="break-words">{pattern.pattern}</span>
                {overlaps.length > 0 && <OverlapNotes overlaps={overlaps} />}
            </span>
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
                    helperText={t("chatbot.intents.patternHelper", { max: CHATBOT_RULES.patternMaxLength })}
                    maxLength={CHATBOT_RULES.patternMaxLength}
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
