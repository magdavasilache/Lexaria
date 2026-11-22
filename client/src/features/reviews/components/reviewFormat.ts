import { useTranslation } from "react-i18next";
import { DEFAULT_AVATAR, serverAssetUrl } from "../../../shared/utils/assets";
import type { ReviewAuthor } from "../reviewTypes";

export const avatarOf = (author: ReviewAuthor) => serverAssetUrl(author.avatar_url) ?? DEFAULT_AVATAR;

export const useDateFormat = () => {
    const { i18n } = useTranslation();
    const formatter = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium" });
    return (value: string) => formatter.format(new Date(value.length === 10 ? `${value}T00:00:00` : value));
};

export const wasEdited = (createdAt: string, updatedAt: string) => Date.parse(updatedAt) - Date.parse(createdAt) > 1000;
