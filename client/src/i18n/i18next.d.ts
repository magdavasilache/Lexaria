import "i18next";
import type frontAdmin from "./locales/front/en/admin.json";
import type frontBooks from "./locales/front/en/books.json";
import type frontCommon from "./locales/front/en/common.json";
import type frontUsers from "./locales/front/en/users.json";
import type frontValidation from "./locales/front/en/validation.json";
import type frontWelcome from "./locales/front/en/welcome.json";
import type backAudit from "./locales/back/en/audit.json";
import type backBooks from "./locales/back/en/books.json";
import type backCommon from "./locales/back/en/common.json";
import type backUsers from "./locales/back/en/users.json";
import type backValidation from "./locales/back/en/validation.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "front/common";
    resources: {
      "front/admin": typeof frontAdmin;
      "front/books": typeof frontBooks;
      "front/common": typeof frontCommon;
      "front/users": typeof frontUsers;
      "front/validation": typeof frontValidation;
      "front/welcome": typeof frontWelcome;
      "back/audit": typeof backAudit;
      "back/books": typeof backBooks;
      "back/common": typeof backCommon;
      "back/users": typeof backUsers;
      "back/validation": typeof backValidation;
    };
  }
}
