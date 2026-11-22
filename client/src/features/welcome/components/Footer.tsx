import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../auth/stores/useAuthStore";
import { useThemeStore } from "../../../shared/stores/useThemeStore";
import { BRAND_LOGO } from "../../../shared/utils/assets";

const linkClass =
    "rounded-control hover:text-primaryLight dark:hover:text-primaryDark transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark";

export default function Footer() {
    const { t } = useTranslation("front/welcome")
    const theme = useThemeStore(state => state.theme)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)

    return (
        <footer className="mt-auto font-libre bg-surfaceLight dark:bg-surfaceDark text-fontPrimaryLight dark:text-fontPrimaryDark border-t border-dividerLight dark:border-dividerDark">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-center md:text-left">
                <div className="flex flex-col items-center md:items-start gap-3">
                    <img src={BRAND_LOGO[theme]} alt="Lexaria" className="h-9 w-auto" />
                    <p className="text-fontMutedLight dark:text-fontMutedDark max-w-xs">
                        {t("footer.tagline")}
                    </p>
                </div>

                <nav aria-label={t("footer.navLabel")} className="md:justify-self-center">
                    <p className="font-semibold mb-3">{t("footer.explore")}</p>
                    <ul className="flex flex-col gap-2">
                        <li><Link to={isAuthenticated ? "/homepage" : "/"} className={linkClass}>{t("footer.browseBooks")}</Link></li>
                        {isAuthenticated && (
                            <li><Link to="/goodreads-import" className={linkClass}>{t("footer.goodreadsImport")}</Link></li>
                        )}
                    </ul>
                </nav>

                <div className="md:justify-self-end md:text-right">
                    <p className="font-semibold mb-3">{t("footer.about")}</p>
                    <p className="text-fontMutedLight dark:text-fontMutedDark max-w-xs mx-auto md:mx-0 md:ml-auto">
                        {t("footer.aboutText")}
                    </p>
                </div>
            </div>

            <div className="border-t border-dividerLight dark:border-dividerDark">
                <p className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 text-xs text-center text-fontMutedLight dark:text-fontMutedDark">
                    {t("footer.copyright", { year: new Date().getFullYear(), author: "Magda Vasilache" })}
                </p>
            </div>
        </footer>
    );
}
