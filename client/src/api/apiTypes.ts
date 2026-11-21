import type { AxiosError } from "axios";
import { Message, MessageParams, serverKey, serverParams } from "../i18n/message";

export type ApiErrorItem = {
  code: string;
  key: string;
  params: MessageParams;
  message: string;
  field: string | null;
  hint_key: string | null;
  hint: string | null;
};

export type ApiWarning = {
  code: string;
  key: string;
  params: MessageParams;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  errors: ApiErrorItem[];
  warnings: ApiWarning[];
  meta: Record<string, unknown> | null;
};

export class ApiError extends Error {
  readonly status: number | null;
  readonly errors: ApiErrorItem[];
  readonly requestId: string | null;
  readonly text: Message;

  constructor(text: Message, status: number | null, errors: ApiErrorItem[], requestId: string | null) {
    super(errors[0]?.message ?? text.key);
    this.name = "ApiError";
    this.text = text;
    this.status = status;
    this.errors = errors;
    this.requestId = requestId;
  }

  get code(): string | null {
    return this.errors[0]?.code ?? null;
  }

  get hint(): Message | null {
    return hintOf(this.errors[0]);
  }

  get fieldErrors(): ApiErrorItem[] {
    return this.errors.filter((error) => error.field);
  }

  get hasOnlyFieldErrors(): boolean {
    return this.errors.length > 0 && this.fieldErrors.length === this.errors.length;
  }
}

const STATUSES_WITH_MESSAGE = new Set([400, 401, 403, 404, 500]);

export const messageOf = (item: ApiErrorItem): Message => ({ key: serverKey(item.key), params: serverParams(item.params) });

export const hintOf = (item: ApiErrorItem | undefined): Message | null =>
  item?.hint_key ? { key: serverKey(item.hint_key) } : null;

const isEnvelope = (value: unknown): value is ApiResponse<unknown> =>
  typeof value === "object" && value !== null && "success" in value && Array.isArray((value as ApiResponse<unknown>).errors);

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;

  const axiosError = error as AxiosError;
  const status = axiosError.response?.status ?? null;
  const body = axiosError.response?.data;

  if (isEnvelope(body) && body.errors.length > 0) {
    const requestId = typeof body.meta?.request_id === "string" ? body.meta.request_id : null;
    return new ApiError(messageOf(body.errors[0]), status, body.errors, requestId);
  }

  if (axiosError.code === "ECONNABORTED" || axiosError.message?.includes("timeout")) {
    return new ApiError({ key: "front/common:network.timeout" }, null, [], null);
  }

  if (!axiosError.response) {
    return new ApiError({ key: "front/common:network.offline" }, null, [], null);
  }

  const key = status && STATUSES_WITH_MESSAGE.has(status) ? `front/common:status.${status}` : "front/common:status.unexpected";
  return new ApiError({ key }, status, [], null);
};

export const unwrap = <T>(response: { data: ApiResponse<T> }): T => response.data.data as T;
