import "i18next";
import type frontAdmin from "./locales/front/en/admin.json";
import type frontBooks from "./locales/front/en/books.json";
import type frontCatalog from "./locales/front/en/catalog.json";
import type frontChatbot from "./locales/front/en/chatbot.json";
import type frontCommon from "./locales/front/en/common.json";
import type frontImports from "./locales/front/en/imports.json";
import type frontReading from "./locales/front/en/reading.json";
import type frontReviews from "./locales/front/en/reviews.json";
import type frontStats from "./locales/front/en/stats.json";
import type frontUsers from "./locales/front/en/users.json";
import type frontValidation from "./locales/front/en/validation.json";
import type frontWelcome from "./locales/front/en/welcome.json";
import type backAudit from "./locales/back/en/audit.json";
import type backBooks from "./locales/back/en/books.json";
import type backCatalog from "./locales/back/en/catalog.json";
import type backChatbot from "./locales/back/en/chatbot.json";
import type backCommon from "./locales/back/en/common.json";
import type backImports from "./locales/back/en/imports.json";
import type backReading from "./locales/back/en/reading.json";
import type backReviews from "./locales/back/en/reviews.json";
import type backStats from "./locales/back/en/stats.json";
import type backUsers from "./locales/back/en/users.json";
import type backValidation from "./locales/back/en/validation.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "front/common";
    resources: {
      "front/admin": typeof frontAdmin;
      "front/books": typeof frontBooks;
      "front/catalog": typeof frontCatalog;
      "front/chatbot": typeof frontChatbot;
      "front/common": typeof frontCommon;
      "front/imports": typeof frontImports;
      "front/reading": typeof frontReading;
      "front/reviews": typeof frontReviews;
      "front/stats": typeof frontStats;
      "front/users": typeof frontUsers;
      "front/validation": typeof frontValidation;
      "front/welcome": typeof frontWelcome;
      "back/audit": typeof backAudit;
      "back/books": typeof backBooks;
      "back/catalog": typeof backCatalog;
      "back/chatbot": typeof backChatbot;
      "back/common": typeof backCommon;
      "back/imports": typeof backImports;
      "back/reading": typeof backReading;
      "back/reviews": typeof backReviews;
      "back/stats": typeof backStats;
      "back/users": typeof backUsers;
      "back/validation": typeof backValidation;
    };
  }
}
