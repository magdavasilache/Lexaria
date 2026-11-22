import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, House, ShieldX } from "lucide-react";
import Button from "../../shared/components/Button";
import StatusPanel from "../../shared/components/StatusPanel";
import { useDocumentTitle } from "../../shared/utils/useDocumentTitle";

export default function ForbiddenPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    useDocumentTitle(t("pageTitle.forbidden"));

    return (
        <StatusPanel
            icon={ShieldX}
            code={t("errors.forbidden.code")}
            title={t("errors.forbidden.title")}
            description={t("errors.forbidden.description")}
            actions={
                <>
                    <Button leftIcon={House} onClick={() => navigate("/homepage", { replace: true })} className="min-h-10">
                        {t("errors.actions.home")}
                    </Button>
                    <Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate(-1)} className="min-h-10">
                        {t("errors.actions.back")}
                    </Button>
                </>
            }
        />
    );
}
