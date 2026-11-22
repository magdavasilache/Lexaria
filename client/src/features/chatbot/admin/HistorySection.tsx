import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, ListPlus, X } from "lucide-react";
import Badge from "../../../shared/components/Badge";
import Button from "../../../shared/components/Button";
import DataTable, { Column, TableFilter } from "../../../shared/components/table/DataTable";
import { FeedbackReview, TrainingRecord, UnknownMessage } from "../chatbotTypes";
import {
    useDeleteUnknownMessage,
    useDismissFeedback,
    useFeedbackReviews,
    usePromoteFeedback,
    usePromoteUnknownMessage,
    useTrainings,
    useUnknownMessages,
} from "../hooks/useChatbot";
import { replyText } from "../replyText";
import PromoteModal from "./PromoteModal";

const VIEWS = ["trainings", "unknowns", "feedback"] as const;
type View = (typeof VIEWS)[number];
type Promoting = { kind: "unknown"; row: UnknownMessage } | { kind: "feedback"; row: FeedbackReview } | null;

const ROW_BUTTON = "min-h-10 min-w-10 justify-center";

const useFormats = () => {
    const { i18n } = useTranslation();
    return {
        date: new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeStyle: "short" }),
        percent: new Intl.NumberFormat(i18n.resolvedLanguage, { style: "percent", maximumFractionDigits: 0 }),
        number: new Intl.NumberFormat(i18n.resolvedLanguage),
    };
};

function CountChip({ count, label }: { count: number; label: string }) {
    if (count === 0) return null;
    return (
        <span className="inline-flex items-center rounded-full border border-countChipBorderLight bg-countChipLight px-1.5 text-xs font-semibold tabular-nums text-countChipTextLight dark:border-countChipBorderDark dark:bg-countChipDark dark:text-countChipTextDark">
            <span aria-hidden="true">{count}</span>
            <span className="sr-only">{label}</span>
        </span>
    );
}

export default function HistorySection() {
    const { t } = useTranslation("front/admin");
    const formats = useFormats();
    const [view, setView] = useState<View>("trainings");
    const [promoting, setPromoting] = useState<Promoting>(null);

    const trainings = useTrainings();
    const unknowns = useUnknownMessages();
    const reviews = useFeedbackReviews();
    const deleteUnknown = useDeleteUnknownMessage();
    const promoteUnknown = usePromoteUnknownMessage();
    const promoteFeedback = usePromoteFeedback();
    const dismissFeedback = useDismissFeedback();
    const counts: Record<View, number> = { trainings: 0, unknowns: unknowns.data?.length ?? 0, feedback: reviews.data?.length ?? 0 };

    const promote = (intentId: number) => {
        if (!promoting) return;
        const close = { onSuccess: () => setPromoting(null) };
        if (promoting.kind === "unknown") promoteUnknown.mutate({ id: promoting.row.id, intentId }, close);
        else promoteFeedback.mutate({ id: promoting.row.id, intentId }, close);
    };

    const dateColumn = <T extends { created_at: string; last_seen_at?: string }>(key: "created_at" | "last_seen_at" = "created_at"): Column<T> => ({
        key,
        label: t("chatbot.history.date"),
        width: "12rem",
        render: (row) => <span className="whitespace-nowrap text-fontMutedLight dark:text-fontMutedDark">{formats.date.format(new Date(row[key] ?? row.created_at))}</span>,
    });

    const confidenceColumn = <T extends { confidence: number | null }>(): Column<T> => ({
        key: "confidence",
        label: t("chatbot.history.confidence"),
        width: "7rem",
        align: "right",
        render: (row) =>
            row.confidence === null ? "—" : <span className="text-warningTextLight dark:text-warningTextDark">{formats.percent.format(row.confidence)}</span>,
    });

    const promoteButton = (label: string, onClick: () => void, disabled = false) => (
        <Button variant="ghost" size="sm" leftIcon={ListPlus} aria-label={t("chatbot.history.addPatternFor", { label })} onClick={onClick} disabled={disabled} className={ROW_BUTTON}>
            <span className="hidden lg:inline">{t("chatbot.history.addPattern")}</span>
        </Button>
    );

    const trainingColumns: Column<TrainingRecord>[] = [
        { key: "id", label: t("chatbot.history.id"), width: "5rem", render: (row) => <span className="text-fontMutedLight dark:text-fontMutedDark">#{row.id}</span> },
        { key: "model", label: t("chatbot.history.model"), render: (row) => <span className="break-all font-mono text-xs">{row.model.split("/").pop()}</span> },
        { key: "intents", label: t("chatbot.history.intents"), width: "6rem", align: "right", render: (row) => (row.intents === null ? "—" : formats.number.format(row.intents)) },
        { key: "samples", label: t("chatbot.history.samples"), width: "6rem", align: "right", render: (row) => (row.samples === null ? "—" : formats.number.format(row.samples)) },
        { key: "accuracy", label: t("chatbot.history.accuracy"), width: "7rem", align: "right", render: (row) => (row.accuracy === null ? "—" : formats.percent.format(row.accuracy)) },
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
        confidenceColumn<UnknownMessage>(),
        { key: "occurrences", label: t("chatbot.history.occurrences"), width: "6rem", align: "right", render: (row) => formats.number.format(row.occurrences) },
        dateColumn<UnknownMessage>("last_seen_at"),
    ];

    const feedbackColumns: Column<FeedbackReview>[] = [
        {
            key: "question",
            label: t("chatbot.history.question"),
            render: (row) =>
                row.question ? (
                    <span className="line-clamp-2 break-words">{row.question}</span>
                ) : (
                    <span className="text-fontMutedLight dark:text-fontMutedDark">{t("chatbot.history.noQuestion")}</span>
                ),
        },
        {
            key: "reply",
            label: t("chatbot.history.reply"),
            render: (row) => <span className="line-clamp-2 break-words text-fontMutedLight dark:text-fontMutedDark">{replyText(row.lines)}</span>,
        },
        {
            key: "intent",
            label: t("chatbot.history.intent"),
            width: "10rem",
            render: (row) => (row.intent ? <span className="break-all font-mono text-xs">{row.intent}</span> : <Badge success={false}>{t("chatbot.history.fallback")}</Badge>),
        },
        confidenceColumn<FeedbackReview>(),
        dateColumn<FeedbackReview>(),
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
                            <CountChip count={counts[key]} label={t(`chatbot.history.${key}Count`, { count: counts[key] })} />
                        </span>
                    </Button>
                ))}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                {view === "trainings" && (
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
                )}
                {view === "unknowns" && (
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
                        rowActions={(row) => promoteButton(row.message, () => setPromoting({ kind: "unknown", row }))}
                        onDelete={(row) => deleteUnknown.mutate(row.id)}
                    />
                )}
                {view === "feedback" && (
                    <DataTable
                        key="feedback"
                        stateKey="admin.chatbot.feedback"
                        data={reviews.data ?? []}
                        columns={feedbackColumns}
                        searchKeys={["question", "intent"]}
                        isLoading={reviews.isLoading}
                        isError={reviews.isError}
                        onRetry={() => reviews.refetch()}
                        emptyMessage={t("chatbot.history.feedbackEmpty")}
                        rowLabel={(row) => row.question ?? replyText(row.lines)}
                        rowActions={(row) => (
                            <>
                                {promoteButton(row.question ?? "", () => setPromoting({ kind: "feedback", row }), !row.question)}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={X}
                                    aria-label={t("chatbot.history.dismissFor", { label: row.question ?? replyText(row.lines) })}
                                    title={t("chatbot.history.dismiss")}
                                    loading={dismissFeedback.isPending && dismissFeedback.variables === row.id}
                                    onClick={() => dismissFeedback.mutate(row.id)}
                                    className={ROW_BUTTON}
                                />
                            </>
                        )}
                    />
                )}
            </div>

            <PromoteModal
                target={
                    promoting === null
                        ? null
                        : promoting.kind === "unknown"
                          ? { message: promoting.row.message, confidence: promoting.row.confidence }
                          : { message: promoting.row.question ?? "", confidence: promoting.row.confidence }
                }
                description={t(promoting?.kind === "feedback" ? "chatbot.promote.feedbackDescription" : "chatbot.promote.description")}
                isPending={promoteUnknown.isPending || promoteFeedback.isPending}
                onClose={() => setPromoting(null)}
                onSubmit={promote}
            />
        </div>
    );
}
