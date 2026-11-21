import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, ListPlus } from "lucide-react";
import Badge from "./Badge";
import Button from "../../../global-components/buttons/Button";
import Modal from "../../../global-components/modal/Modal";
import DataTable, { Column, TableFilter } from "../../../global-components/table/DataTable";
import SelectField from "../../../forms/components/SelectField";
import { TrainingRecord, UnknownMessage } from "../../../types/chatbot-types";
import {
    useGetTrainingHistory,
    useGetUnknownMessages,
    useDeleteUnknown,
    usePromoteUnknown,
} from "../../../api-handling/rtk-hooks/chatbot/useHistory";
import { useGetIntents } from "../../../api-handling/rtk-hooks/chatbot/useIntents";

const VIEWS = ["trainings", "unknowns"] as const;
type View = (typeof VIEWS)[number];

const useFormats = () => {
    const { i18n } = useTranslation();
    return useMemo(
        () => ({
            date: new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeStyle: "short" }),
            percent: new Intl.NumberFormat(i18n.resolvedLanguage, { style: "percent", maximumFractionDigits: 0 }),
        }),
        [i18n.resolvedLanguage]
    );
};

function PromoteModal({ unknown, onClose }: { unknown: UnknownMessage | null; onClose: () => void }) {
    const { t } = useTranslation(["front/admin", "front/common"]);
    const formats = useFormats();
    const [intentId, setIntentId] = useState<number | null>(null);
    const { data: intents = [] } = useGetIntents();
    const promote = usePromoteUnknown();
    const formId = "promote-unknown-form";

    const close = () => {
        setIntentId(null);
        onClose();
    };

    const submit = () => {
        if (!unknown || intentId === null) return;
        promote.mutate({ id: unknown.id, intentId }, { onSuccess: close });
    };

    return (
        <Modal
            open={unknown !== null}
            onClose={close}
            size="md"
            icon={ListPlus}
            title={t("chatbot.promote.title")}
            description={t("chatbot.promote.description")}
            dismissible={!promote.isPending}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={close} disabled={promote.isPending}>{t("front/common:actions.cancel")}</Button>
                    <Button
                        type="submit"
                        form={formId}
                        size="sm"
                        disabled={intentId === null}
                        loading={promote.isPending}
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
                onSubmit={(event) => { event.preventDefault(); submit(); }}
                className="flex flex-col gap-4"
            >
                {unknown && (
                    <blockquote className="flex flex-col gap-1 rounded-control border border-panelBorderLight bg-panelLight px-3 py-2.5 text-sm dark:border-panelBorderDark dark:bg-panelDark">
                        <span className="break-words">“{unknown.message}”</span>
                        <span className="text-xs text-warningTextLight dark:text-warningTextDark">
                            {t("chatbot.promote.confidence", { value: formats.percent.format(unknown.confidence) })}
                        </span>
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

export default function HistorySection() {
    const { t } = useTranslation("front/admin");
    const formats = useFormats();
    const [view, setView] = useState<View>("trainings");
    const [promoting, setPromoting] = useState<UnknownMessage | null>(null);

    const trainings = useGetTrainingHistory();
    const unknowns = useGetUnknownMessages();
    const deleteUnknown = useDeleteUnknown();
    const unknownCount = unknowns.data?.length ?? 0;

    const dateColumn = <T extends { created_at: string }>(): Column<T> => ({
        key: "created_at",
        label: t("chatbot.history.date"),
        width: "12rem",
        render: (row) => <span className="whitespace-nowrap text-fontMutedLight dark:text-fontMutedDark">{formats.date.format(new Date(row.created_at))}</span>,
    });

    const trainingColumns: Column<TrainingRecord>[] = [
        { key: "id", label: t("chatbot.history.id"), width: "5rem", render: (row) => <span className="text-fontMutedLight dark:text-fontMutedDark">#{row.id}</span> },
        { key: "epochs", label: t("chatbot.history.epochs"), width: "6rem", align: "right" },
        {
            key: "success",
            label: t("chatbot.history.status"),
            render: (row) => <Badge success={row.success}>{t(row.success ? "chatbot.history.success" : "chatbot.history.failure")}</Badge>,
        },
        dateColumn<TrainingRecord>(),
    ];

    const trainingFilters: TableFilter<TrainingRecord>[] = [
        {
            kind: "select",
            key: "status",
            label: t("chatbot.history.status"),
            icon: CircleCheck,
            options: [
                { value: "", label: t("chatbot.history.allStatuses") },
                { value: "success", label: t("chatbot.history.success") },
                { value: "failure", label: t("chatbot.history.failure") },
            ],
            matches: (row, value) => row.success === (value === "success"),
        },
    ];

    const unknownColumns: Column<UnknownMessage>[] = [
        { key: "message", label: t("chatbot.history.message"), render: (row) => <span className="line-clamp-2 break-words">{row.message}</span> },
        {
            key: "confidence",
            label: t("chatbot.history.confidence"),
            width: "7rem",
            align: "right",
            render: (row) => <span className="text-warningTextLight dark:text-warningTextDark">{formats.percent.format(row.confidence)}</span>,
        },
        dateColumn<UnknownMessage>(),
    ];

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div
                role="group"
                aria-label={t("chatbot.history.views")}
                className="flex w-full shrink-0 overflow-hidden rounded-control border border-primaryLight dark:border-primaryDark divide-x divide-primaryLight/40 dark:divide-primaryDark/40 sm:w-auto sm:self-start"
            >
                {VIEWS.map((key) => (
                    <Button key={key} variant="segment" size="sm" aria-pressed={view === key} onClick={() => setView(key)} className="min-h-10 sm:px-4">
                        <span className="flex items-center justify-center gap-1.5">
                            {t(`chatbot.history.${key}`)}
                            {key === "unknowns" && unknownCount > 0 && (
                                <span className="inline-flex items-center rounded-full border border-countChipBorderLight bg-countChipLight px-1.5 text-xs font-semibold tabular-nums text-countChipTextLight dark:border-countChipBorderDark dark:bg-countChipDark dark:text-countChipTextDark">
                                    <span aria-hidden="true">{unknownCount}</span>
                                    <span className="sr-only">{t("chatbot.history.unknownCount", { count: unknownCount })}</span>
                                </span>
                            )}
                        </span>
                    </Button>
                ))}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {view === "trainings" ? (
                    <DataTable
                        key="trainings"
                        stateKey="admin.chatbot.trainings"
                        data={trainings.data ?? []}
                        columns={trainingColumns}
                        filters={trainingFilters}
                        isLoading={trainings.isLoading}
                        isError={trainings.isError}
                        onRetry={() => trainings.refetch()}
                    />
                ) : (
                    <DataTable
                        key="unknowns"
                        stateKey="admin.chatbot.unknowns"
                        data={unknowns.data ?? []}
                        columns={unknownColumns}
                        searchKeys={["message"]}
                        isLoading={unknowns.isLoading}
                        isError={unknowns.isError}
                        onRetry={() => unknowns.refetch()}
                        rowLabel={(row) => row.message}
                        rowActions={(row) => (
                            <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={ListPlus}
                                aria-label={t("chatbot.history.addPatternFor", { label: row.message })}
                                onClick={() => setPromoting(row)}
                                className="min-h-10"
                            >
                                <span className="hidden lg:inline">{t("chatbot.history.addPattern")}</span>
                            </Button>
                        )}
                        onDelete={(row) => deleteUnknown.mutate(row.id)}
                    />
                )}
            </div>

            <PromoteModal unknown={promoting} onClose={() => setPromoting(null)} />
        </div>
    );
}
