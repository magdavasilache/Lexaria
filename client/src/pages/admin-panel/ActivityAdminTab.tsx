import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Button from "../../global-components/buttons/Button";
import Badge from "./components/Badge";
import { useAuditActions, useAuditLogs } from "../../api-handling/rtk-hooks/audit-log/useAuditLogs";
import { serverKey, serverParams, translate } from "../../i18n/message";
import { AUDIT_OUTCOMES, AuditLog, AuditOutcome } from "../../types/audit-log/auditLogTypes";

const PAGE_SIZE = 25;

type FilterState = {
    action: string;
    outcome: AuditOutcome | "";
    dateFrom: string;
    dateTo: string;
};

const EMPTY_FILTERS: FilterState = { action: "", outcome: "", dateFrom: "", dateTo: "" };

const CONTROL =
    "w-full min-h-10 px-3 py-2 text-sm rounded-control bg-inputLight dark:bg-inputDark " +
    "border border-dividerLight dark:border-dividerDark focus:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark";

const startOfDay = (date: string) => (date ? new Date(`${date}T00:00:00`).toISOString() : undefined);
const endOfDay = (date: string) => (date ? new Date(`${date}T23:59:59.999`).toISOString() : undefined);

const actionLabel = (log: AuditLog) => (log.action_key ? translate({ key: serverKey(log.action_key) }) : log.action);

const descriptionOf = (log: AuditLog) =>
    translate({ key: serverKey(log.description_key), params: serverParams(log.params) });

const requestOf = (log: AuditLog) => [log.method, log.path].filter(Boolean).join(" ");

export default function ActivityAdminTab() {
    const { t, i18n } = useTranslation("front/admin");
    const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
    const [offset, setOffset] = useState(0);

    const query = useMemo(
        () => ({
            action: filters.action || undefined,
            outcome: filters.outcome || undefined,
            date_from: startOfDay(filters.dateFrom),
            date_to: endOfDay(filters.dateTo),
            offset,
            limit: PAGE_SIZE,
        }),
        [filters, offset]
    );

    const { data: actions = [] } = useAuditActions();
    const { data, isLoading, isError, isFetching, refetch } = useAuditLogs(query);
    const logs = data?.items ?? [];
    const total = data?.total ?? 0;

    const dateFormat = useMemo(
        () => new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeStyle: "short" }),
        [i18n.resolvedLanguage]
    );

    const updateFilter = <K extends keyof FilterState>(name: K, value: FilterState[K]) => {
        setFilters((current) => ({ ...current, [name]: value }));
        setOffset(0);
    };

    const resetFilters = () => {
        setFilters(EMPTY_FILTERS);
        setOffset(0);
    };

    const hasFilters = Object.values(filters).some(Boolean);
    const outcomeBadge = (log: AuditLog) => (
        <Badge success={log.outcome === "success"}>{t(`activity.${log.outcome}`)}</Badge>
    );
    const userOf = (log: AuditLog) => log.username ?? t("activity.anonymous");

    const renderResults = () => {
        if (isLoading) {
            return <p className="py-8 text-center text-sm opacity-60">{t("activity.loading")}</p>;
        }
        if (isError) {
            return (
                <div className="py-8 flex justify-center">
                    <Button variant="outline" size="sm" leftIcon={RotateCcw} onClick={() => refetch()}>
                        {t("activity.retry")}
                    </Button>
                </div>
            );
        }
        if (logs.length === 0) {
            return <p className="py-8 text-center text-sm opacity-60">{t("activity.empty")}</p>;
        }
        return (
            <>
                <ul className="flex flex-col gap-3 md:hidden">
                    {logs.map((log) => (
                        <li
                            key={log.id}
                            className="p-3 flex flex-col gap-2 rounded-panel bg-paperLight dark:bg-paperDark border border-dividerLight dark:border-dividerDark"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-medium">{actionLabel(log)}</span>
                                {outcomeBadge(log)}
                            </div>
                            <p className="text-sm break-words">{descriptionOf(log)}</p>
                            <div className="flex flex-col gap-0.5 text-xs opacity-60 break-all">
                                <span>{dateFormat.format(new Date(log.created_at))} · {userOf(log)}</span>
                                {requestOf(log) && <span>{requestOf(log)}</span>}
                            </div>
                        </li>
                    ))}
                </ul>

                <table className="hidden md:table w-full table-fixed text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-wide opacity-60 border-b border-dividerLight dark:border-dividerDark">
                            <th className="py-2 pr-3 w-36 lg:w-44 font-medium">{t("activity.time")}</th>
                            <th className="py-2 pr-3 w-28 lg:w-36 font-medium">{t("activity.user")}</th>
                            <th className="py-2 pr-3 w-32 lg:w-40 font-medium">{t("activity.action")}</th>
                            <th className="py-2 pr-3 font-medium">{t("activity.description")}</th>
                            <th className="py-2 pr-3 w-24 font-medium">{t("activity.outcome")}</th>
                            <th className="hidden xl:table-cell py-2 w-56 font-medium">{t("activity.request")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="align-top border-b border-dividerLight dark:border-dividerDark">
                                <td className="py-2 pr-3 opacity-70">{dateFormat.format(new Date(log.created_at))}</td>
                                <td className="py-2 pr-3 break-words">{userOf(log)}</td>
                                <td className="py-2 pr-3 break-words">{actionLabel(log)}</td>
                                <td className="py-2 pr-3 break-words">{descriptionOf(log)}</td>
                                <td className="py-2 pr-3">{outcomeBadge(log)}</td>
                                <td className="hidden xl:table-cell py-2 text-xs opacity-60 break-all">{requestOf(log)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    };

    const firstShown = total === 0 ? 0 : offset + 1;
    const lastShown = Math.min(offset + PAGE_SIZE, total);

    return (
        <div className="h-full flex flex-col gap-4 min-w-0">
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <legend className="sr-only">{t("activity.filters")}</legend>
                <label className="flex flex-col gap-1 text-xs opacity-80">
                    {t("activity.action")}
                    <select
                        className={CONTROL}
                        value={filters.action}
                        onChange={(event) => updateFilter("action", event.target.value)}
                    >
                        <option value="">{t("activity.allActions")}</option>
                        {actions.map((action) => (
                            <option key={action.id} value={action.id}>
                                {translate({ key: serverKey(action.key) })}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-xs opacity-80">
                    {t("activity.outcome")}
                    <select
                        className={CONTROL}
                        value={filters.outcome}
                        onChange={(event) => updateFilter("outcome", event.target.value as AuditOutcome | "")}
                    >
                        <option value="">{t("activity.allOutcomes")}</option>
                        {AUDIT_OUTCOMES.map((outcome) => (
                            <option key={outcome} value={outcome}>
                                {t(`activity.${outcome}`)}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-xs opacity-80">
                    {t("activity.from")}
                    <input
                        type="date"
                        className={CONTROL}
                        value={filters.dateFrom}
                        max={filters.dateTo || undefined}
                        onChange={(event) => updateFilter("dateFrom", event.target.value)}
                    />
                </label>
                <label className="flex flex-col gap-1 text-xs opacity-80">
                    {t("activity.to")}
                    <input
                        type="date"
                        className={CONTROL}
                        value={filters.dateTo}
                        min={filters.dateFrom || undefined}
                        onChange={(event) => updateFilter("dateTo", event.target.value)}
                    />
                </label>
            </fieldset>

            {hasFilters && (
                <div>
                    <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={resetFilters} className="min-h-10">
                        {t("activity.resetFilters")}
                    </Button>
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto" aria-busy={isFetching}>
                {renderResults()}
            </div>

            {total > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="opacity-70">{t("activity.range", { from: firstShown, to: lastShown, total })}</span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            icon={ChevronLeft}
                            aria-label={t("activity.previous")}
                            className="min-w-10 min-h-10"
                            disabled={offset === 0}
                            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                        />
                        <Button
                            variant="outline"
                            icon={ChevronRight}
                            aria-label={t("activity.next")}
                            className="min-w-10 min-h-10"
                            disabled={offset + PAGE_SIZE >= total}
                            onClick={() => setOffset(offset + PAGE_SIZE)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
