import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { API_URL } from "../utils/constants";
import { currentLanguage } from "../../i18n";
import { useAuthStore } from "../../features/auth/stores/useAuthStore";
import { useSnackbarStore } from "../stores/useSnackbarStore";
import { ApiError, type ApiResponse, type Page, messageOf, toApiError } from "./apiTypes";

const DEFAULT_TIMEOUT_MS = 5000;
const ERROR_DURATION_MS = 4000;
const WARNING_DURATION_MS = 5000;
const REFRESHABLE_CODES = new Set(["TOKEN_EXPIRED", "INVALID_TOKEN"]);

const httpClient = axios.create({ baseURL: API_URL, timeout: DEFAULT_TIMEOUT_MS });

const reportError = (error: ApiError, config: AxiosRequestConfig | undefined) => {
  if (config?.silent) return;
  if (config?.handlesFieldErrors && error.hasOnlyFieldErrors) return;
  const type = error.status === null ? "warning" : "error";
  useSnackbarStore.getState().showSnackBar(error.text, type, ERROR_DURATION_MS, error.hint);
};

const reportWarnings = (body: unknown, config: AxiosRequestConfig) => {
  if (config.silent || config.handlesWarnings) return;
  const warning = (body as Partial<ApiResponse<unknown>> | undefined)?.warnings?.[0];
  if (warning) useSnackbarStore.getState().showSnackBar(messageOf(warning), "info", WARNING_DURATION_MS);
};

const canRefresh = (error: ApiError, config: AxiosRequestConfig | undefined): config is AxiosRequestConfig =>
  Boolean(config && !config.skipAuth && !config.retriedAfterRefresh && error.status === 401 && REFRESHABLE_CODES.has(error.code ?? ""));

httpClient.interceptors.request.use(async (config) => {
  config.headers["Accept-Language"] = currentLanguage();
  if (config.skipAuth) return config;
  const auth = useAuthStore.getState();
  const token = config.retriedAfterRefresh ? auth.accessToken : await auth.getFreshAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    reportWarnings(response.data, response.config);
    return response;
  },
  async (error) => {
    const apiError = toApiError(error);
    const config: AxiosRequestConfig | undefined = error?.config;

    if (canRefresh(apiError, config) && (await useAuthStore.getState().refreshAccessToken())) {
      return httpClient.request({ ...config, retriedAfterRefresh: true });
    }

    reportError(apiError, config);
    if (apiError.status === 401 && config && !config.skipAuth) useAuthStore.getState().clearSession();
    return Promise.reject(apiError);
  }
);

const dataOf = <T>(response: AxiosResponse<ApiResponse<T>>): T => response.data.data as T;

export const apiClient = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => dataOf(await httpClient.get<ApiResponse<T>>(url, config)),
  post: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    dataOf(await httpClient.post<ApiResponse<T>>(url, body, config)),
  put: async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    dataOf(await httpClient.put<ApiResponse<T>>(url, body, config)),
  delete: async <T = void>(url: string, config?: AxiosRequestConfig): Promise<T> => dataOf(await httpClient.delete<ApiResponse<T>>(url, config)),
  list: async <T>(url: string, config?: AxiosRequestConfig): Promise<T[]> => dataOf(await httpClient.get<ApiResponse<T[]>>(url, config)) ?? [],
  page: async <T>(url: string, config?: AxiosRequestConfig): Promise<Page<T>> => {
    const { data, meta } = (await httpClient.get<ApiResponse<T[]>>(url, config)).data;
    return { items: data ?? [], total: typeof meta?.total === "number" ? meta.total : 0 };
  },
  envelope: async <T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> => (await httpClient.request<ApiResponse<T>>(config)).data,
};
