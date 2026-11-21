import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAuditActionsQuery, getAuditLogsQuery } from "../../../api/auditLogAPI";
import type { AuditLogFilters } from "../../../types/audit-log/auditLogTypes";

export const useAuditLogs = (filters: AuditLogFilters) =>
  useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => getAuditLogsQuery(filters),
    placeholderData: keepPreviousData,
  });

export const useAuditActions = () =>
  useQuery({
    queryKey: ["audit-log-actions"],
    queryFn: getAuditActionsQuery,
    staleTime: Infinity,
  });
