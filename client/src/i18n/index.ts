import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { BOOK_RULES, IMPORT_RULES } from "../schemas/bookRules";
import { REVIEW_RULES } from "../schemas/reviewRules";
import { PASSWORD_RULES, USERNAME_RULES } from "../schemas/userRules";
import { TRAINING_RULES } from "../schemas/chatbotRules";

export const LANGUAGES = ["en", "ro"] as const;
export type Language = (typeof LANGUAGES)[number];

const files = import.meta.glob<Record<string, unknown>>("./locales/*/*/*.json", { eager: true, import: "default" });

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, content] of Object.entries(files)) {
  const [, side, language, module] = path.match(/\.\/locales\/(\w+)\/(\w+)\/(\w+)\.json$/) ?? [];
  if (!side) continue;
  resources[language] ??= {};
  resources[language][`${side}/${module}`] = content;
}

const applyLanguage = (language: string) => {
  document.documentElement.lang = language;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: LANGUAGES,
    fallbackLng: "en",
    load: "languageOnly",
    defaultNS: "front/common",
    ns: Object.keys(resources.en),
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "lexaria.language",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
      defaultVariables: {
        epochsMin: TRAINING_RULES.epochsMin,
        usernameMin: USERNAME_RULES.minLength,
        usernameMax: USERNAME_RULES.maxLength,
        passwordMin: PASSWORD_RULES.minLength,
        passwordMaxBytes: PASSWORD_RULES.maxBytes,
        loginPasswordMax: PASSWORD_RULES.loginMaxLength,
        bookTitleMax: BOOK_RULES.titleMaxLength,
        bookSynopsisMax: BOOK_RULES.synopsisMaxLength,
        bookPagesMax: BOOK_RULES.pagesMax,
        bookListItemMax: BOOK_RULES.listItemMaxLength,
        bookListMaxItems: BOOK_RULES.listMaxItems,
        bookImagesMax: BOOK_RULES.imagesMax,
        bookImageMaxMb: BOOK_RULES.imageMaxMb,
        importFileMaxMb: IMPORT_RULES.fileMaxMb,
        reviewContentMax: REVIEW_RULES.contentMaxLength,
        commentMax: REVIEW_RULES.commentMaxLength,
      },
    },
  });

applyLanguage(i18n.resolvedLanguage ?? "en");
i18n.on("languageChanged", applyLanguage);

export const currentLanguage = (): Language => (i18n.resolvedLanguage as Language | undefined) ?? "en";

export default i18n;
