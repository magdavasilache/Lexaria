import axios from "axios";
import { API_URL } from "../utils/constants";
import { useSnackbarStore } from "../api-handling/context/snackbar/useSnackbarStore";

export const publicAxios = (url: string) => {
  const instance = axios.create({
    baseURL: `${API_URL}${url}`,
    timeout: 5000,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const response = error.response;
      const snackbar = useSnackbarStore.getState();

      let message = "An unexpected error occurred.";
      let hint: string | null = null;
      let type: "error" | "warning" | "info" | "success" = "error";

      const detail = response?.data?.detail;

      if (typeof detail === "string") {
        message = detail;
      } else if (typeof detail === "object" && detail !== null) {
        message = detail.detail || message;
        hint = detail.hint || null;
      }

      if (!response?.data?.detail && response?.status) {
        switch (response.status) {
          case 400:
            message = "Bad request.";
            break;
          case 401:
            message = "Unauthorized.";
            break;
          case 404:
            message = "Resource not found.";
            break;
          case 500:
            message = "Server error.";
            break;
        }
      } else if (error.message.includes("timeout")) {
        message = "Request timed out. Please check your connection.";
        type = "warning";
      }

      snackbar.showSnackBar(message, type, 5000, hint);
      return Promise.reject(error);
    }
  );

  return instance;
};
