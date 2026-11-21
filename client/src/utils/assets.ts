import { API_URL } from "./constants";
import { useThemeStore } from "../state_management/useThemeStore";


type ThemedAsset = Record<"light" | "dark", string>;

export const BRAND_LOGO: ThemedAsset = {
    light: "/lexaria-brand.svg",
    dark: "/lexaria-brand-dark.svg",
};

export const THEME_COVER: ThemedAsset = {
    light: "/covers/forest-theme-cover.svg",
    dark: "/covers/espresso-theme-cover.svg",
};

export const COVER_PLACEHOLDER: ThemedAsset = {
    light: "/cover-placeholder.svg",
    dark: "/book-card-dark.svg",
};

export const useCoverPlaceholder = () => COVER_PLACEHOLDER[useThemeStore((state) => state.theme)];
export const DEFAULT_AVATAR = "/default-avatar.svg";

export const serverAssetUrl = (path: string | null | undefined) => (path ? new URL(path, API_URL).toString() : null);
