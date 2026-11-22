import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { BOOK_RULES, IMPORT_RULES } from "../features/books/schemas/bookRules";
import { CATALOG_RULES } from "../features/catalog/schemas/catalogRules";
import { EDITION_RULES, READING_RULES } from "../features/reading/schemas/readingRules";
import { REVIEW_RULES } from "../features/reviews/schemas/reviewRules";
import { CHALLENGE_RULES } from "../features/stats/schemas/statsRules";
import { AVATAR_RULES, BAN_RULES, PASSWORD_RULES, USERNAME_RULES } from "../features/auth/schemas/userRules";
import { CHATBOT_RULES } from "../features/chatbot/schemas/chatbotRules";

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
        chatbotTagMax: CHATBOT_RULES.tagMaxLength,
        chatbotPatternMax: CHATBOT_RULES.patternMaxLength,
        chatbotResponseMax: CHATBOT_RULES.responseMaxLength,
        chatbotImportMaxMb: CHATBOT_RULES.importFileMaxMb,
        chatMessageMax: CHATBOT_RULES.messageMaxLength,
        usernameMin: USERNAME_RULES.minLength,
        usernameMax: USERNAME_RULES.maxLength,
        passwordMin: PASSWORD_RULES.minLength,
        passwordMaxBytes: PASSWORD_RULES.maxBytes,
        loginPasswordMax: PASSWORD_RULES.loginMaxLength,
        avatarMaxMb: AVATAR_RULES.maxMb,
        avatarSizePx: AVATAR_RULES.sizePx,
        banReasonMax: BAN_RULES.reasonMaxLength,
        banDaysMax: BAN_RULES.durationDaysMax,
        bookTitleMax: BOOK_RULES.titleMaxLength,
        bookSynopsisMax: BOOK_RULES.synopsisMaxLength,
        bookPagesMax: BOOK_RULES.pagesMax,
        bookListItemMax: BOOK_RULES.listItemMaxLength,
        bookListMaxItems: BOOK_RULES.listMaxItems,
        bookImagesMax: BOOK_RULES.imagesMax,
        bookImageMaxMb: BOOK_RULES.imageMaxMb,
        moodsPerVoteMax: BOOK_RULES.moodsPerVoteMax,
        importFileMaxMb: IMPORT_RULES.fileMaxMb,
        reviewContentMax: REVIEW_RULES.contentMaxLength,
        commentMax: REVIEW_RULES.commentMaxLength,
        readingNoteMax: READING_RULES.noteMaxLength,
        readingMaxSessionHours: READING_RULES.maxSessionHours,
        readingGoalMin: READING_RULES.goalMinutesMin,
        readingGoalMax: READING_RULES.goalMinutesMax,
        editionTextMax: EDITION_RULES.translatorMaxLength,
        editionPagesMax: EDITION_RULES.pagesMax,
        challengeBooksMax: CHALLENGE_RULES.booksMax,
        challengePagesMax: CHALLENGE_RULES.pagesMax,
        challengeHoursMax: CHALLENGE_RULES.hoursMax,
        languageNameMax: CATALOG_RULES.languageNameMaxLength,
        genreNameMax: CATALOG_RULES.genreNameMaxLength,
        countryNameMax: CATALOG_RULES.countryNameMaxLength,
        awardNameMax: CATALOG_RULES.awardNameMaxLength,
        awardDescriptionMax: CATALOG_RULES.awardDescriptionMaxLength,
        awardYearMin: CATALOG_RULES.awardYearMin,
        authorNameMax: CATALOG_RULES.authorNameMaxLength,
        authorAboutMax: CATALOG_RULES.authorAboutMaxLength,
        authorImageMaxMb: CATALOG_RULES.imageMaxMb,
      },
    },
  });

applyLanguage(i18n.resolvedLanguage ?? "en");
i18n.on("languageChanged", applyLanguage);

export const currentLanguage = (): Language => (i18n.resolvedLanguage as Language | undefined) ?? "en";

export default i18n;
