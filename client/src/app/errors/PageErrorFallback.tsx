import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { FallbackProps } from "react-error-boundary";
import { House, RotateCcw, TriangleAlert } from "lucide-react";
import Button from "../../shared/components/Button";
import StatusPanel from "../../shared/components/StatusPanel";
import { ApiError } from "../../shared/api/apiTypes";
import { translate } from "../../i18n/message";
import { useDocumentTitle } from "../../shared/utils/useDocumentTitle";

export default function PageErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    useDocumentTitle(t("pageTitle.error"));
    const apiError = error instanceof ApiError ? error : null;

    return (
        <StatusPanel
            icon={TriangleAlert}
            code={apiError?.status ? String(apiError.status) : undefined}
            title={t("errors.page.title")}
            description={apiError ? translate(apiError.text) : t("errors.page.description")}
            details={apiError?.requestId ? t("errors.requestId", { id: apiError.requestId }) : null}
            actions={
                <>
                    <Button leftIcon={RotateCcw} onClick={resetErrorBoundary} className="min-h-10">
                        {t("errors.actions.retry")}
                    </Button>
                    <Button variant="outline" leftIcon={House} onClick={() => navigate("/homepage")} className="min-h-10">
                        {t("errors.actions.home")}
                    </Button>
                </>
            }
        />
    );
}
