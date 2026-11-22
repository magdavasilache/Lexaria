import type { QueryParams, Schema, Page } from "../../shared/api/apiTypes";

export type AuditAction = Schema<"AuditAction">;
export type AuditOutcome = Schema<"AuditOutcome">;
export const AUDIT_OUTCOMES = ["success", "failure"] as const satisfies readonly AuditOutcome[];

export type AuditLog = Schema<"AuditLogRead">;
export type AuditActionOption = Schema<"AuditActionRead">;
export type AuditLogFilters = QueryParams<"list_audit_logs_admin_audit_logs_get">;

export type AuditLogPage = Page<AuditLog>;
