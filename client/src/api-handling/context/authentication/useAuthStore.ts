import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserType } from "../../../types/auth-types/userTypes";
import { authorizedAxios } from "../../../api/authorizedAxios";

interface AuthStoreState{
    loading: boolean;
    error: string | null
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    user: UserType | null;
}

interface AuthStoreAction{
    setAccessToken: (token: string) => void
    refreshAccessToken: () => Promise<void>;
    logout: () => void;
}

export const useAuthStore = create<AuthStoreState & AuthStoreAction>()(
    persist(
        (set, get) => {
            return{
                loading: false,
                error: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                user: null,
                
                setAccessToken: (token: string) => {
                    set({ accessToken: token, isAuthenticated: true })
                },
                logout: () => {
                    set({ accessToken: null, isAuthenticated: false, user: null })
                },
                refreshAccessToken: async () => {
                    const refreshToken = get().refreshToken;
                    if (!refreshToken) return get().logout();
            
                    try {
                      const res = await authorizedAxios("/user").post("/refresh-token", {
                        refresh_token: refreshToken,
                      });
                      const { access_token, refresh_token } = res.data;
                      set({
                        accessToken: access_token,
                        refreshToken: refresh_token,
                        isAuthenticated: true,
                      });
                    } catch (err) {
                      console.error("Failed to refresh token:", err);
                      get().logout();
                    }
                  },
            }
        },
        {
            name: 'auth-store',
        }
    )
)