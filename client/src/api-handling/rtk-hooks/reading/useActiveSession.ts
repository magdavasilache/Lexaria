import { useQuery } from "@tanstack/react-query";
import { getActiveSessionQuery } from "../../../api/readingAPI";
import { useAuthStore } from "../../context/authentication/useAuthStore";
import { readingKeys } from "./readingKeys";

const SYNC_INTERVAL_MS = 60_000;

export const useActiveSession = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: readingKeys.activeSession(),
    queryFn: getActiveSessionQuery,
    enabled: isAuthenticated,
    refetchInterval: SYNC_INTERVAL_MS,
    refetchOnWindowFocus: "always",
  });
};
