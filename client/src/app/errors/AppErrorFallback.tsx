import { useTranslation } from "react-i18next";
import { RefreshCw, TriangleAlert } from "lucide-react";
import Button from "../../shared/components/Button";
import StatusPanel from "../../shared/components/StatusPanel";

export default function AppErrorFallback() {
    const { t } = useTranslation();

    return (
        <main className="min-h-dvh bg-backgroundLight dark:bg-backgroundDark">
            <StatusPanel
                icon={TriangleAlert}
                title={t("errors.app.title")}
                description={t("errors.app.description")}
                actions={
                    <Button leftIcon={RefreshCw} onClick={() => window.location.assign("/")} className="min-h-10">
                        {t("errors.actions.reload")}
                    </Button>
                }
            />
        </main>
    );
}
