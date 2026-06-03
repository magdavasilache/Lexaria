export type UserType = {
    id: number;
    username: string;
}

export type TokenType = {
    access_token: string;
    refresh_token: string;
}

export type UserOut = {
    username: string;
    profile_picture: string | null
}