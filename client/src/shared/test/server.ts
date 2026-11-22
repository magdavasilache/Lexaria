import { setupServer } from "msw/node";
import { API_URL } from "../utils/constants";

export const server = setupServer();

export const apiUrl = (path: string) => `${API_URL}${path.replace(/^\//, "")}`;

export const envelope = <T>(data: T, extra: { warnings?: unknown[]; meta?: Record<string, unknown> | null } = {}) => ({
  success: true,
  data,
  errors: [],
  warnings: extra.warnings ?? [],
  meta: extra.meta ?? null,
});

export const failure = (code: string, key: string, field: string | null = null) => ({
  success: false,
  data: null,
  errors: [{ code, key, params: {}, message: key, field, hint_key: null, hint: null }],
  warnings: [],
  meta: { request_id: "req-1" },
});
