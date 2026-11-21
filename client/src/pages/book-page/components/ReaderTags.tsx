import { useTranslation } from "react-i18next";
import booksEn from "../../../i18n/locales/front/en/books.json";
import type { ReaderTag } from "../../../types/book-types/bookTypes";

type ReaderTagId = keyof typeof booksEn.readerTags.tags;

const isKnownTag = (tag: string): tag is ReaderTagId => tag in booksEn.readerTags.tags;

export default function ReaderTags({ tags }: { tags: ReaderTag[] }) {
    const { t } = useTranslation("front/books");
    const known = tags.filter((item): item is ReaderTag & { tag: ReaderTagId } => isKnownTag(item.tag));
    if (known.length === 0) return null;
    const max = Math.max(...known.map((item) => item.count));

    return (
        <section
            aria-labelledby="reader-tags-heading"
            className="flex w-full flex-col gap-3 rounded-panel border border-panelBorderLight bg-panelLight p-4 text-fontPrimaryLight shadow-soft-md dark:border-panelBorderDark dark:bg-panelDark dark:text-fontPrimaryDark dark:shadow-deep-md sm:p-5"
        >
            <h2 id="reader-tags-heading" className="text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
                {t("readerTags.title")}
            </h2>
            <ul className="flex flex-wrap gap-2">
                {known.map(({ tag, count }) => (
                    <li
                        key={tag}
                        title={t("readerTags.mentions", { count })}
                        className={`flex items-center gap-1.5 rounded-control px-2.5 py-1 text-sm ${
                            count === max
                                ? "bg-primaryLight text-onPrimaryLight dark:bg-primaryDark dark:text-onPrimaryDark"
                                : "bg-primaryLightTone text-primaryLightDarkTone dark:bg-primaryDarkLightTone dark:text-primaryDarkDarkTone"
                        }`}
                    >
                        <span>{t(`readerTags.tags.${tag}`)}</span>
                        <span className="text-xs tabular-nums opacity-80" aria-hidden="true">{count}</span>
                        <span className="sr-only">{t("readerTags.mentions", { count })}</span>
                    </li>
                ))}
            </ul>
        </section>
    );
}
