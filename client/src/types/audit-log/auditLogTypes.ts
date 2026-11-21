import type { MessageParams } from "../../i18n/message";

export const AUDIT_OUTCOMES = ["success", "failure"] as const;
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export type AuditLog = {
  id: number;
  created_at: string;
  user_id: number | null;
  username: string | null;
  method: string | null;
  path: string | null;
  action: string;
  action_key: string | null;
  action_message: string | null;
  description_key: string;
  params: MessageParams;
  description: string;
  outcome: AuditOutcome;
  error_code: string | null;
  entity_type: string | null;
  entity_id: number | null;
  request_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
};

export type AuditActionOption = {
  id: string;
  key: string;
  message: string;
};

export type AuditLogFilters = {
  action?: string;
  outcome?: AuditOutcome;
  date_from?: string;
  date_to?: string;
  offset: number;
  limit: number;
};

export type AuditLogPage = {
  items: AuditLog[];
  total: number;
};
