import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CalendarArrowDown, CalendarArrowUp, CircleCheck, Zap } from "lucide-react";
import Badge from "./components/Badge";
import DataTable, { Column, TableFilter } from "../../global-components/table/DataTable";
import { useDataTableState } from "../../global-components/table/useDataTableState";
import { useAuditActions, useAuditLogs } from "../../api-handling/rtk-hooks/audit-log/useAuditLogs";
import { serverKey, serverParams, translate } from "../../i18n/message";
import { AUDIT_OUTCOMES, AuditLog, AuditOutcome } from "../../types/audit-log/auditLogTypes";

const STATE_KEY = "admin.activity";
const PAGE_SIZE = 25;

const startOfDay = (date: string) => (date ? new Date(`${date}T00:00:00`).toISOString() : undefined);
const endOfDay = (date: string) => (date ? new Date(`${date}T23:59:59.999`).toISOString() : undefined);

const actionLabel = (log: AuditLog) => (log.action_key ? translate({ key: serverKey(log.action_key) }) : log.action);

const descriptionOf = (log: AuditLog) =>
    translate({ key: serverKey(log.description_key), params: serverParams(log.params) });

const requestOf = (log: AuditLog) => [log.method, log.path].filter(Boolean).join(" ");

export default function ActivityAdminTab() {
    const { t, i18n } = useTranslation("front/admin");
    const { state } = useDataTableState(STATE_KEY, PAGE_SIZE);
    const action = (state.values.action as string | undefined) ?? "";
    const outcome = (state.values.outcome as AuditOutcome | "" | undefined) ?? "";
    const dateFrom = (state.values.dateFrom as string | undefined) ?? "";
    const dateTo = (state.values.dateTo as string | undefined) ?? "";

    const query = useMemo(
        () => ({
            action: action || undefined,
            outcome: outcome || undefined,
            date_from: startOfDay(dateFrom),
            date_to: endOfDay(dateTo),
            offset: (state.page - 1) * state.pageSize,
            limit: state.pageSize,
        }),
        [action, outcome, dateFrom, dateTo, state.page, state.pageSize]
    );

    const { data: actions = [] } = useAuditActions();
    const { data, isLoading, isError, isFetching, refetch } = useAuditLogs(query);

    const dateFormat = useMemo(
        () => new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeStyle: "short" }),
        [i18n.resolvedLanguage]
    );

    const filters: TableFilter<AuditLog>[] = [
        {
            kind: "select",
            key: "action",
            label: t("activity.action"),
            icon: Zap,
            options: [
                { value: "", label: t("activity.allActions") },
                ...actions.map((option) => ({ value: option.id, label: translate({ key: serverKey(option.key) }) })),
            ],
        },
        {
            kind: "select",
            key: "outcome",
            label: t("activity.outcome"),
            icon: CircleCheck,
            options: [
                { value: "", label: t("activity.allOutcomes") },
                ...AUDIT_OUTCOMES.map((value) => ({ value, label: t(`activity.${value}`) })),
            ],
        },
        { kind: "date", key: "dateFrom", label: t("activity.from"), icon: CalendarArrowUp, max: dateTo || undefined },
        { kind: "date", key: "dateTo", label: t("activity.to"), icon: CalendarArrowDown, min: dateFrom || undefined },
    ];

    const columns: Column<AuditLog>[] = [
        {
            key: "created_at",
            label: t("activity.time"),
            width: "11rem",
            render: (log) => <span className="whitespace-nowrap text-fontMutedLight dark:text-fontMutedDark">{dateFormat.format(new Date(log.created_at))}</span>,
        },
        { key: "username", label: t("activity.user"), width: "9rem", render: (log) => <span className="break-words">{log.username ?? t("activity.anonymous")}</span> },
        { key: "action", label: t("activity.action"), width: "10rem", render: (log) => <span className="break-words">{actionLabel(log)}</span> },
        { key: "description", label: t("activity.description"), render: (log) => <span className="break-words">{descriptionOf(log)}</span> },
        {
            key: "outcome",
            label: t("activity.outcome"),
            width: "6rem",
            render: (log) => <Badge success={log.outcome === "success"}>{t(`activity.${log.outcome}`)}</Badge>,
        },
        {
            key: "request",
            label: t("activity.request"),
            width: "14rem",
            className: "hidden xl:table-cell",
            render: (log) => <span className="break-all text-xs text-fontMutedLight dark:text-fontMutedDark">{requestOf(log) || "—"}</span>,
        },
    ];

    return (
        <DataTable
            stateKey={STATE_KEY}
            data={data?.items ?? []}
            remoteTotal={data?.total ?? 0}
            columns={columns}
            filters={filters}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            onRetry={() => refetch()}
            defaultPageSize={PAGE_SIZE}
        />
    );
}
