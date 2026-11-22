import { useEffect } from "react";
import { AUTH_STORAGE_KEY, useAuthStore } from "../stores/useAuthStore";

const hasStoredUser = (raw: string | null) => {
    if (!raw) return false;
    try {
        return Boolean(JSON.parse(raw)?.state?.user);
    } catch {
        return false;
    }
};

export const useSessionKeeper = () => {
    useEffect(() => {
        void useAuthStore.getState().restoreSession();

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                void useAuthStore.getState().refreshIfStale();
            }
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key !== AUTH_STORAGE_KEY) return;
            const { isAuthenticated, clearSession, refreshAccessToken } = useAuthStore.getState();
            if (!hasStoredUser(event.newValue)) {
                if (isAuthenticated) clearSession();
            } else if (!isAuthenticated) {
                void useAuthStore.persist.rehydrate();
                void refreshAccessToken();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("storage", handleStorage);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);
};
