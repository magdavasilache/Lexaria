import { apiClient } from "../../../shared/api/apiClient";
import type { AuditActionOption, AuditLog, AuditLogFilters, AuditLogPage } from "../auditLogTypes";

export const getAuditLogsQuery = (filters: AuditLogFilters): Promise<AuditLogPage> => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ""));
  return apiClient.page<AuditLog>("/admin/audit-logs", { params });
};

export const getAuditActionsQuery = (): Promise<AuditActionOption[]> => apiClient.list<AuditActionOption>("/admin/audit-logs/actions");
