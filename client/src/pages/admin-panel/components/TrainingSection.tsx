import { useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Play, RotateCcw } from "lucide-react";
import Button from "../../../global-components/buttons/Button";
import DataTable, { Column, TableFilter } from "../../../global-components/table/DataTable";
import NumberField from "../../../forms/components/NumberField";
import { useFieldStatus } from "../../../forms/useFieldStatus";
import { TrainingFormValues, trainingFormSchema } from "../../../schemas/chatbotSchemas";
import { TRAINING_RULES } from "../../../schemas/chatbotRules";
import { useTraining } from "../../../api-handling/rtk-hooks/chatbot/useTraining";
import { TrainingStatus } from "../../../types/chatbot-types";

const LOG_LEVELS = ["success", "error", "warning", "info", "log"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];
type LogRow = { id: number; level: LogLevel; message: string };

const PREFIXES: [string, LogLevel][] = [["[✓]", "success"], ["[ERROR]", "error"], ["[WARN]", "warning"], ["[INFO]", "info"]];

const toRow = (line: string, index: number): LogRow => {
    const match = PREFIXES.find(([prefix]) => line.startsWith(prefix));
    return { id: index + 1, level: match?.[1] ?? "log", message: match ? line.slice(match[0].length).trim() : line };
};

const LEVEL_STYLES: Record<LogLevel, string> = {
    success: "bg-successLightTone text-successTextLight dark:bg-successDarkTone dark:text-successTextDark",
    error: "bg-errorLightTone text-errorTextLight dark:bg-errorDarkTone dark:text-errorTextDark",
    warning: "bg-warningLightTone text-warningTextLight dark:bg-warningDarkTone dark:text-warningTextDark",
    info: "bg-infoLightTone text-infoTextLight dark:bg-infoDarkTone dark:text-infoTextDark",
    log: "border border-panelBorderLight text-fontMutedLight dark:border-panelBorderDark dark:text-fontMutedDark",
};

const STATUS_STYLES: Record<Exclude<TrainingStatus, "idle">, { badge: string; bar: string; note: string }> = {
    running: { badge: LEVEL_STYLES.warning, bar: "bg-primaryLight dark:bg-primaryDark", note: "" },
    done: { badge: LEVEL_STYLES.success, bar: "bg-successSolidLight dark:bg-successSolidDark", note: "text-successTextLight dark:text-successTextDark" },
    error: { badge: LEVEL_STYLES.error, bar: "bg-errorSolidLight dark:bg-errorSolidDark", note: "text-errorTextLight dark:text-errorTextDark" },
};

export default function TrainingSection() {
    const { t } = useTranslation("front/admin");
    const formId = useId();
    const { status, logs, progress, startTraining, reset } = useTraining();
    const isRunning = status === "running";

    const { control, handleSubmit, formState: { errors } } = useForm<TrainingFormValues>({
        resolver: zodResolver(trainingFormSchema),
        mode: "onTouched",
        defaultValues: { epochs: TRAINING_RULES.epochsDefault },
    });
    const fieldStatus = useFieldStatus(trainingFormSchema, control);

    const rows = useMemo(() => logs.map(toRow).reverse(), [logs]);

    const columns: Column<LogRow>[] = [
        { key: "id", label: t("chatbot.training.line"), width: "4rem", align: "right", render: (row) => <span className="text-fontMutedLight dark:text-fontMutedDark">{row.id}</span> },
        {
            key: "level",
            label: t("chatbot.training.level"),
            width: "7rem",
            render: (row) => <span className={`inline-block rounded-xs px-2 py-0.5 text-xs font-medium ${LEVEL_STYLES[row.level]}`}>{t(`chatbot.training.levels.${row.level}`)}</span>,
        },
        { key: "message", label: t("chatbot.training.message"), render: (row) => <span className="break-words font-mono text-xs">{row.message}</span> },
    ];

    const filters: TableFilter<LogRow>[] = [
        {
            kind: "select",
            key: "level",
            label: t("chatbot.training.level"),
            icon: Layers,
            options: [
                { value: "", label: t("chatbot.training.allLevels") },
                ...LOG_LEVELS.map((level) => ({ value: level, label: t(`chatbot.training.levels.${level}`) })),
            ],
            matches: (row, value) => row.level === value,
        },
    ];

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex shrink-0 flex-col gap-3 rounded-panel border border-panelBorderLight bg-panelLight px-3 py-3 shadow-soft-sm dark:border-panelBorderDark dark:bg-panelDark dark:shadow-deep-sm sm:px-4">
                <form
                    id={formId}
                    noValidate
                    onSubmit={handleSubmit(({ epochs }) => epochs !== null && startTraining(epochs))}
                    className="flex flex-col gap-3 sm:flex-row sm:items-start"
                >
                    <div className="w-full sm:w-44">
                        <Controller
                            control={control}
                            name="epochs"
                            render={({ field }) => (
                                <NumberField
                                    label={t("chatbot.training.epochs")}
                                    hideLabel
                                    required
                                    min={TRAINING_RULES.epochsMin}
                                    step={1}
                                    disabled={isRunning}
                                    placeholder={t("chatbot.training.epochs")}
                                    helperText={t("chatbot.training.epochsHelper")}
                                    error={errors.epochs}
                                    status={fieldStatus("epochs")}
                                    value={field.value}
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                />
                            )}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="submit" size="sm" leftIcon={Play} loading={isRunning} loadingText={t("chatbot.training.running")} className="min-h-10">
                            {t("chatbot.training.start")}
                        </Button>
                        {status !== "idle" && (
                            <Button variant="outline" size="sm" leftIcon={RotateCcw} onClick={reset} disabled={isRunning} className="min-h-10">
                                {t("chatbot.training.clear")}
                            </Button>
                        )}
                    </div>
                    {status !== "idle" && (
                        <span role="status" className={`self-start rounded-full px-2.5 py-1 text-xs font-medium sm:ml-auto sm:self-center ${STATUS_STYLES[status].badge}`}>
                            {t(`chatbot.training.status.${status}`)}
                        </span>
                    )}
                </form>

                {status !== "idle" && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs text-fontMutedLight dark:text-fontMutedDark">
                            <span>{t("chatbot.training.progress")}</span>
                            <span className="tabular-nums">{t("chatbot.training.percent", { value: progress })}</span>
                        </div>
                        <div
                            role="progressbar"
                            aria-label={t("chatbot.training.progress")}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                            className="h-1.5 w-full overflow-hidden rounded-full bg-panelSelectedLight dark:bg-panelSelectedDark"
                        >
                            <div className={`h-full rounded-full transition-all duration-500 ${STATUS_STYLES[status].bar}`} style={{ width: `${progress}%` }} />
                        </div>
                        {status !== "running" && <p className={`text-xs ${STATUS_STYLES[status].note}`}>{t(`chatbot.training.note.${status}`)}</p>}
                    </div>
                )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <DataTable
                    stateKey="admin.chatbot.trainingLogs"
                    data={rows}
                    columns={columns}
                    filters={filters}
                    searchKeys={["message"]}
                    defaultPageSize={50}
                    emptyMessage={t(status === "idle" ? "chatbot.training.emptyIdle" : "chatbot.training.emptyConnecting")}
                />
            </div>
        </div>
    );
}
