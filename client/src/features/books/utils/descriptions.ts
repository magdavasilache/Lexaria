import type { BookDescription } from "../types/bookTypes";

const FALLBACK_LANGUAGE = "en";

const baseOf = (language: string) => language.split("-")[0].toLowerCase();

export const pickDescription = (descriptions: BookDescription[], language: string): BookDescription | null =>
    descriptions.find((item) => item.language === language) ??
    descriptions.find((item) => baseOf(item.language) === baseOf(language)) ??
    descriptions.find((item) => item.language === FALLBACK_LANGUAGE) ??
    descriptions[0] ??
    null;

export const languageName = (code: string, displayLanguage: string) => {
    try {
        return new Intl.DisplayNames([displayLanguage], { type: "language" }).of(code) ?? code;
    } catch {
        return code;
    }
};
