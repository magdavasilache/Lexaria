import axios from "axios";
import { API_URL } from "../utils/constants";
import { currentLanguage } from "../i18n";
import { toApiError } from "./apiTypes";
import { reportApiError } from "./reportApiError";

export const publicAxios = (url: string) => {
  const instance = axios.create({
    baseURL: `${API_URL}${url}`,
    timeout: 5000,
  });

  instance.interceptors.request.use((config) => {
    config.headers["Accept-Language"] = currentLanguage();
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const apiError = toApiError(error);
      reportApiError(apiError, error.config, 5000);
      return Promise.reject(apiError);
    }
  );

  return instance;
};
