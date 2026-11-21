import { API_URL } from "./constants";


type ThemedAsset = Record<"light" | "dark", string>;

export const BRAND_LOGO: ThemedAsset = {
    light: "/lexaria-brand.svg",
    dark: "/lexaria-brand-dark.svg",
};

export const THEME_COVER: ThemedAsset = {
    light: "/covers/forest-theme-cover.svg",
    dark: "/covers/espresso-theme-cover.svg",
};

export const COVER_PLACEHOLDER = "/cover-placeholder.svg";
export const DEFAULT_AVATAR = "/default-avatar.svg";

export const serverAssetUrl = (path: string | null | undefined) => (path ? new URL(path, API_URL).toString() : null);
