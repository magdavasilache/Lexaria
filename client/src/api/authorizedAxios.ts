import axios from "axios"
import { API_URL } from "../utils/constants"
import { currentLanguage } from "../i18n";
import { useAuthStore } from "../api-handling/context/authentication/useAuthStore"
import { toApiError } from "./apiTypes";
import { reportApiError } from "./reportApiError";

const REFRESHABLE_CODES = new Set(["TOKEN_EXPIRED", "INVALID_TOKEN"]);

export const authorizedAxios = (url: string) => {
  const instance = axios.create({
    baseURL: `${API_URL}${url}`,
    timeout: 5000,
  });

  instance.interceptors.request.use(
    async (config) => {
      config.headers["Accept-Language"] = currentLanguage();
      const token = config.retriedAfterRefresh
        ? useAuthStore.getState().accessToken
        : await useAuthStore.getState().getFreshAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const apiError = toApiError(error);
      const config = error.config;

      if (apiError.status === 401 && config && !config.retriedAfterRefresh && REFRESHABLE_CODES.has(apiError.code ?? "")) {
        const refreshed = await useAuthStore.getState().refreshAccessToken();
        if (refreshed) {
          return instance.request({ ...config, retriedAfterRefresh: true });
        }
      }

      reportApiError(apiError, config, 2500);

      if (apiError.status === 401) {
        useAuthStore.getState().clearSession();
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
};
