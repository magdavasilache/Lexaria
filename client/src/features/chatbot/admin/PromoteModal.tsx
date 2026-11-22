import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ListPlus } from "lucide-react";
import Button from "../../../shared/components/Button";
import Modal from "../../../shared/components/modal/Modal";
import SelectField from "../../../shared/forms/fields/SelectField";
import { useIntents } from "../hooks/useChatbot";

export type PromoteTarget = { message: string; confidence: number | null; intentId?: number | null };

type Props = {
    target: PromoteTarget | null;
    description: string;
    isPending: boolean;
    onClose: () => void;
    onSubmit: (intentId: number) => void;
};

export default function PromoteModal({ target, ...props }: Props) {
    return <PromoteDialog key={target ? `${target.message}-${target.intentId ?? ""}` : "closed"} target={target} {...props} />;
}

function PromoteDialog({ target, description, isPending, onClose, onSubmit }: Props) {
    const { t, i18n } = useTranslation(["front/admin", "front/common"]);
    const percent = new Intl.NumberFormat(i18n.resolvedLanguage, { style: "percent", maximumFractionDigits: 0 });
    const [intentId, setIntentId] = useState<number | null>(target?.intentId ?? null);
    const { data: intents = [] } = useIntents();
    const formId = "promote-pattern-form";

    return (
        <Modal
            open={target !== null}
            onClose={onClose}
            size="md"
            icon={ListPlus}
            title={t("chatbot.promote.title")}
            description={description}
            dismissible={!isPending}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>{t("front/common:actions.cancel")}</Button>
                    <Button
                        type="submit"
                        form={formId}
                        size="sm"
                        disabled={intentId === null}
                        loading={isPending}
                        loadingText={t("chatbot.promote.submitting")}
                    >
                        {t("chatbot.promote.submit")}
                    </Button>
                </>
            }
        >
            <form
                id={formId}
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();
                    if (intentId !== null) onSubmit(intentId);
                }}
                className="flex flex-col gap-4"
            >
                {target && (
                    <blockquote className="flex flex-col gap-1 rounded-control border border-panelBorderLight bg-panelLight px-3 py-2.5 text-sm dark:border-panelBorderDark dark:bg-panelDark">
                        <span className="break-words">“{target.message}”</span>
                        {target.confidence !== null && (
                            <span className="text-xs text-warningTextLight dark:text-warningTextDark">
                                {t("chatbot.promote.confidence", { value: percent.format(target.confidence) })}
                            </span>
                        )}
                    </blockquote>
                )}
                <SelectField
                    label={t("chatbot.promote.intent")}
                    required
                    value={intentId}
                    placeholder={t("chatbot.promote.selectIntent")}
                    options={intents.map((intent) => ({
                        value: intent.id,
                        label: t("chatbot.promote.intentOption", { tag: intent.tag, count: intent.patterns.length }),
                    }))}
                    onChange={setIntentId}
                />
            </form>
        </Modal>
    );
}
