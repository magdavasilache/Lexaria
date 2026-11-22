import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AccessToken, UserType } from "../userTypes";
import { logoutRequest, refreshRequest } from "../api/authAPI";
import { ApiError } from "../../../shared/api/apiTypes";
import { queryClient } from "../../../app/queryClient";

export const AUTH_STORAGE_KEY = "auth-store";
const REFRESH_LOCK = "lexaria-auth-refresh";
const REFRESH_LEAD_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;
const RETRY_DELAY_MS = 30_000;

type AuthStatus = "checking" | "authenticated" | "anonymous";

interface AuthStoreState {
    accessToken: string | null;
    accessTokenExpiresAt: number | null;
    user: UserType | null;
    status: AuthStatus;
    isAuthenticated: boolean;
}

interface AuthStoreAction {
    setSession: (token: AccessToken, user: UserType) => void;
    setUser: (user: UserType) => void;
    restoreSession: () => Promise<void>;
    refreshAccessToken: () => Promise<boolean>;
    refreshIfStale: () => Promise<void>;
    getFreshAccessToken: () => Promise<string | null>;
    logout: () => Promise<void>;
    clearSession: () => void;
}

let pendingRefresh: Promise<boolean> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const clearRefreshTimer = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = null;
};

const scheduleRefresh = (delayMs: number) => {
    clearRefreshTimer();
    refreshTimer = setTimeout(() => {
        void useAuthStore.getState().refreshAccessToken();
    }, Math.max(delayMs, MIN_REFRESH_DELAY_MS));
};

const withRefreshLock = <T,>(task: () => Promise<T>): Promise<T> =>
    navigator.locks ? navigator.locks.request(REFRESH_LOCK, task) : task();

const isRejected = (error: unknown) => error instanceof ApiError && error.status === 401;

export const useAuthStore = create<AuthStoreState & AuthStoreAction>()(
    persist(
        (set, get) => {
            const applyToken = (token: AccessToken) => {
                const expiresAt = Date.now() + token.expires_in * 1000;
                set({ accessToken: token.access_token, accessTokenExpiresAt: expiresAt });
                scheduleRefresh(expiresAt - Date.now() - REFRESH_LEAD_MS);
            };

            return {
                accessToken: null,
                accessTokenExpiresAt: null,
                user: null,
                status: "checking",
                isAuthenticated: false,

                setSession: (token, user) => {
                    applyToken(token);
                    set({ user, status: "authenticated", isAuthenticated: true });
                },

                setUser: (user) => set({ user }),

                restoreSession: async () => {
                    if (get().status !== "checking") return;
                    if (!get().user) {
                        set({ status: "anonymous", isAuthenticated: false });
                        return;
                    }
                    const refreshed = await get().refreshAccessToken();
                    if (!refreshed && get().status === "checking") {
                        set({ status: "anonymous", isAuthenticated: false });
                    }
                },

                refreshAccessToken: () => {
                    if (pendingRefresh) return pendingRefresh;

                    pendingRefresh = withRefreshLock(refreshRequest)
                        .then((token) => {
                            applyToken(token);
                            set({ status: "authenticated", isAuthenticated: true });
                            return true;
                        })
                        .catch((error: unknown) => {
                            if (isRejected(error)) {
                                get().clearSession();
                            } else if (get().status === "authenticated") {
                                scheduleRefresh(RETRY_DELAY_MS);
                            }
                            return false;
                        })
                        .finally(() => {
                            pendingRefresh = null;
                        });

                    return pendingRefresh;
                },

                refreshIfStale: async () => {
                    const { status, accessTokenExpiresAt } = get();
                    if (status !== "authenticated") return;
                    if (!accessTokenExpiresAt || accessTokenExpiresAt - Date.now() < REFRESH_LEAD_MS) {
                        await get().refreshAccessToken();
                    }
                },

                getFreshAccessToken: async () => {
                    if (get().status === "checking") {
                        await get().restoreSession();
                    } else {
                        await get().refreshIfStale();
                    }
                    return get().accessToken;
                },

                logout: async () => {
                    clearRefreshTimer();
                    await logoutRequest().catch(() => undefined);
                    get().clearSession();
                },

                clearSession: () => {
                    clearRefreshTimer();
                    set({
                        accessToken: null,
                        accessTokenExpiresAt: null,
                        user: null,
                        status: "anonymous",
                        isAuthenticated: false,
                    });
                    queryClient.clear();
                },
            };
        },
        {
            name: AUTH_STORAGE_KEY,
            version: 1,
            partialize: ({ user }) => ({ user }),
            migrate: (persisted) => ({ user: (persisted as { user?: UserType | null } | null)?.user ?? null }),
        }
    )
)
