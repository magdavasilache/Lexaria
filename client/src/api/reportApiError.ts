import type { AxiosRequestConfig } from "axios";
import { useSnackbarStore } from "../api-handling/context/snackbar/useSnackbarStore";
import { ApiError } from "./apiTypes";

export const reportApiError = (error: ApiError, config: AxiosRequestConfig | undefined, duration: number) => {
  if (config?.handlesFieldErrors && error.hasOnlyFieldErrors) return;
  const type = error.status === null ? "warning" : "error";
  useSnackbarStore.getState().showSnackBar(error.text, type, duration, error.hint);
};
