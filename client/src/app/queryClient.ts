import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../shared/api/apiTypes";

const isServerError = (error: unknown) => error instanceof ApiError && (error.status ?? 0) >= 500;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: (error, query) => isServerError(error) && query.state.data === undefined,
    },
  },
});
