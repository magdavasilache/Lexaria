import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { House, SearchX } from "lucide-react";
import Button from "../../shared/components/Button";
import StatusPanel from "../../shared/components/StatusPanel";
import { useAuthStore } from "../../features/auth/stores/useAuthStore";
import { useDocumentTitle } from "../../shared/utils/useDocumentTitle";

export default function NotFoundPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    useDocumentTitle(t("pageTitle.notFound"));

    return (
        <StatusPanel
            icon={SearchX}
            code={t("errors.notFound.code")}
            title={t("errors.notFound.title")}
            description={t("errors.notFound.description")}
            actions={
                <Button leftIcon={House} onClick={() => navigate(isAuthenticated ? "/homepage" : "/", { replace: true })} className="min-h-10">
                    {t("errors.actions.home")}
                </Button>
            }
        />
    );
}
