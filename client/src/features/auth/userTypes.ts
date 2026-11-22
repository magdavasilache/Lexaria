import type { Schema } from "../../shared/api/apiTypes";

type UserRole = Schema<"UserRole">;

export const USER_ROLE = {
    ADMIN: 1,
    FREE: 2,
    PREMIUM: 3,
} as const satisfies Record<string, UserRole>;

export type UserType = Schema<"UserRead">;
export type AccessToken = Schema<"AccessTokenResponse">;
export type AuthResponse = Schema<"AuthResponse">;
export type RegisterRequest = Schema<"UserCreate">;
export type LoginRequest = Schema<"LoginForm">;
export type AdminUser = Schema<"UserAdminRead">;
export type BanRequest = Schema<"BanCreate">;
