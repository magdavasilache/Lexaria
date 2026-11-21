import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../global-components/buttons/Button";
import { useThemeStore } from "../../../state_management/useThemeStore";
import { useAuthModalStore } from "../../../state_management/useAuthModalStore";
import { useAuthStore } from "../../../api-handling/context/authentication/useAuthStore";
import { THEME_COVER } from "../../../utils/assets";

export default function Description() {
    const { t } = useTranslation("front/welcome")
    const theme = useThemeStore(state => state.theme)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const openModal = useAuthModalStore(state => state.openModal)
    const navigate = useNavigate()

    return (
        <section className="relative w-full min-h-[28rem] md:min-h-[36rem] flex items-center overflow-hidden">
            <img
                src={THEME_COVER[theme]}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/65" />

            <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center animate-fade-in text-onImage">
                <h1 className="font-explora text-5xl sm:text-6xl md:text-7xl leading-tight mb-4">{t("hero.title")}</h1>
                <p className="font-libre text-base sm:text-lg md:text-2xl leading-relaxed">
                    {t("hero.subtitle")}
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                    {isAuthenticated ? (
                        <Button size="lg" rightIcon={ArrowRight} onClick={() => navigate("/homepage")}>
                            {t("hero.goToLibrary")}
                        </Button>
                    ) : (
                        <>
                            <Button size="lg" rightIcon={ArrowRight} onClick={() => openModal("register")}>
                                {t("hero.getStarted")}
                            </Button>
                            <Button size="lg" variant="inverse" className="border border-white/60" onClick={() => openModal("login")}>
                                {t("hero.haveAccount")}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
