import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "../../i18n";
import { server } from "./server";
import { useAuthStore } from "../../features/auth/stores/useAuthStore";
import { useSnackbarStore } from "../stores/useSnackbarStore";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  useSnackbarStore.setState({ open: false, message: null, hint: null });
  localStorage.clear();
});

afterAll(() => server.close());
