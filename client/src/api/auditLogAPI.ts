import type { ApiResponse } from "./apiTypes";
import { authorizedAxios } from "./authorizedAxios";
import type { AuditActionOption, AuditLog, AuditLogFilters, AuditLogPage } from "../types/audit-log/auditLogTypes";

const URL_BASE = "admin/audit-logs";

export const getAuditLogsQuery = async (filters: AuditLogFilters): Promise<AuditLogPage> => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== ""));
  const response = await authorizedAxios(URL_BASE).get<ApiResponse<AuditLog[]>>("", { params });
  return {
    items: response.data.data ?? [],
    total: typeof response.data.meta?.total === "number" ? response.data.meta.total : 0,
  };
};

export const getAuditActionsQuery = async (): Promise<AuditActionOption[]> => {
  const response = await authorizedAxios(URL_BASE).get<ApiResponse<AuditActionOption[]>>("/actions");
  return response.data.data ?? [];
};
