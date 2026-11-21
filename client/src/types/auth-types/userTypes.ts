export const USER_ROLE = {
    ADMIN: 1,
    FREE: 2,
    PREMIUM: 3,
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

export type UserType = {
    id: number;
    username: string;
    role: UserRole;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
}

export type AccessToken = {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export type UserOut = {
    username: string;
    profile_picture: string | null
}
