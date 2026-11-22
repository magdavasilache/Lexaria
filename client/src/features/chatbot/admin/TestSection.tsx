import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, CircleCheck, FlaskConical, ListPlus } from "lucide-react";
import Button from "../../../shared/components/Button";
import BarList from "../../../shared/components/charts/BarList";
import TextAreaField from "../../../shared/forms/fields/TextAreaField";
import { useFieldStatus } from "../../../shared/forms/useFieldStatus";
import { applyFieldErrors } from "../../../shared/forms/applyFieldErrors";
import { useSnackbarStore } from "../../../shared/stores/useSnackbarStore";
import { CHATBOT_RULES } from "../schemas/chatbotRules";
import { ChatMessageValues, chatMessageSchema } from "../schemas/chatbotSchemas";
import type { ChatTestResult } from "../chatbotTypes";
import { useCreatePattern, useIntents, useTestMessage } from "../hooks/useChatbot";
import PromoteModal, { PromoteTarget } from "./PromoteModal";

const PANEL = "rounded-panel border border-panelBorderLight bg-panelLight p-3 shadow-soft-sm dark:border-panelBorderDark dark:bg-panelDark dark:shadow-deep-sm sm:p-4";
const HEADING = "text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark";

type Tested = { message: string; result: ChatTestResult };

function Threshold({ label, value, needed, format }: { label: string; value: number; needed: number; format: (value: number) => string }) {
    const { t } = useTranslation("front/admin");
    const passes = value >= needed;
    return (
        <div className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-xs text-fontMutedLight dark:text-fontMutedDark">{label}</dt>
            <dd className={`text-lg font-semibold tabular-nums ${passes ? "text-successTextLight dark:text-successTextDark" : "text-warningTextLight dark:text-warningTextDark"}`}>
                {format(value)}
            </dd>
            <dd className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("chatbot.test.needed", { value: format(needed) })}</dd>
        </div>
    );
}

export default function TestSection() {
    const { t, i18n } = useTranslation("front/admin");
    const percent = new Intl.NumberFormat(i18n.resolvedLanguage, { style: "percent", maximumFractionDigits: 1 });
    const [tested, setTested] = useState<Tested | null>(null);
    const [promoting, setPromoting] = useState<PromoteTarget | null>(null);
    const test = useTestMessage();
    const createPattern = useCreatePattern();
    const { data: intents = [] } = useIntents();
    const showSnackBar = useSnackbarStore((state) => state.showSnackBar);

    const { register, control, handleSubmit, setError, formState: { errors } } = useForm<ChatMessageValues>({
        resolver: zodResolver(chatMessageSchema),
        mode: "onTouched",
        defaultValues: { message: "" },
    });
    const status = useFieldStatus(chatMessageSchema, control);

    const onSubmit = async ({ message }: ChatMessageValues) => {
        try {
            setTested({ message, result: await test.mutateAsync(message) });
        } catch (error) {
            applyFieldErrors(error, setError, ["message"]);
        }
    };

    const addPattern = (intentId: number) => {
        if (!tested) return;
        const tag = intents.find((intent) => intent.id === intentId)?.tag ?? "";
        createPattern.mutate(
            { intentId, data: { pattern: tested.message } },
            {
                onSuccess: () => {
                    setPromoting(null);
                    showSnackBar(t("chatbot.test.added", { tag }), "success");
                },
                onError: (error) => {
                    setPromoting(null);
                    applyFieldErrors(error, setError, ["message"], { pattern: "message" });
                },
            }
        );
    };

    const result = tested?.result;
    const tooLong = (tested?.message.length ?? 0) > CHATBOT_RULES.patternMaxLength;

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
            <form noValidate onSubmit={handleSubmit(onSubmit)} className={`${PANEL} flex flex-col gap-3`}>
                <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("chatbot.test.description")}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                        <TextAreaField
                            label={t("chatbot.test.message")}
                            required
                            rows={2}
                            placeholder={t("chatbot.test.placeholder")}
                            helperText={t("chatbot.test.helper", { max: CHATBOT_RULES.messageMaxLength })}
                            maxLength={CHATBOT_RULES.messageMaxLength}
                            error={errors.message}
                            status={status("message")}
                            {...register("message")}
                        />
                    </div>
                    <Button type="submit" size="sm" leftIcon={FlaskConical} loading={test.isPending} loadingText={t("chatbot.test.submitting")} className="min-h-10 shrink-0 sm:mt-6">
                        {t("chatbot.test.submit")}
                    </Button>
                </div>
            </form>

            {tested && result ? (
                <section aria-live="polite" aria-label={t("chatbot.test.result")} className={`${PANEL} flex flex-col gap-4`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-2">
                            {result.fallback ? (
                                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-warningTextLight dark:text-warningTextDark" aria-hidden="true" />
                            ) : (
                                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-successTextLight dark:text-successTextDark" aria-hidden="true" />
                            )}
                            <div className="flex min-w-0 flex-col gap-1">
                                <p className="break-words font-semibold">
                                    {result.fallback ? t("chatbot.test.fallback") : t("chatbot.test.answered", { tag: result.intent })}
                                </p>
                                {result.masked.toLowerCase() !== tested.message.toLowerCase() && (
                                    <p className="break-words text-xs text-fontMutedLight dark:text-fontMutedDark">
                                        {t("chatbot.test.masked", { text: result.masked })}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={ListPlus}
                            disabled={tooLong}
                            onClick={() => setPromoting({ message: tested.message, confidence: result.confidence, intentId: result.candidates[0]?.intent_id ?? null })}
                            className="min-h-10 shrink-0 self-start"
                        >
                            {t("chatbot.test.addPattern")}
                        </Button>
                    </div>
                    {tooLong && <p className="text-xs text-warningTextLight dark:text-warningTextDark">{t("chatbot.test.tooLong", { max: CHATBOT_RULES.patternMaxLength })}</p>}

                    <dl className="grid grid-cols-2 gap-3 border-t border-dividerLight pt-3 dark:border-dividerDark">
                        <Threshold label={t("chatbot.test.similarity")} value={result.confidence} needed={result.min_similarity} format={percent.format} />
                        <Threshold label={t("chatbot.test.margin")} value={result.margin} needed={result.min_margin} format={percent.format} />
                    </dl>

                    <div className="flex flex-col gap-2 border-t border-dividerLight pt-3 dark:border-dividerDark">
                        <h3 className={HEADING}>{t("chatbot.test.candidates")}</h3>
                        <BarList
                            items={result.candidates.map((candidate) => ({
                                id: candidate.tag,
                                label: candidate.tag,
                                value: candidate.score,
                                valueText: percent.format(candidate.score),
                                ariaLabel: t("chatbot.test.candidate", { tag: candidate.tag, value: percent.format(candidate.score) }),
                            }))}
                        />
                    </div>
                </section>
            ) : (
                <p className={`${PANEL} text-sm text-fontMutedLight dark:text-fontMutedDark`}>{t("chatbot.test.empty")}</p>
            )}

            <PromoteModal
                target={promoting}
                description={t("chatbot.test.promoteDescription")}
                isPending={createPattern.isPending}
                onClose={() => setPromoting(null)}
                onSubmit={addPattern}
            />
        </div>
    );
}
