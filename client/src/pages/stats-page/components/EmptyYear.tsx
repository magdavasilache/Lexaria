import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChartColumn } from "lucide-react";
import Button from "../../../global-components/buttons/Button";
import { PANEL } from "./styles";

export default function EmptyYear({ year }: { year: number }) {
    const { t } = useTranslation("front/stats");
    const navigate = useNavigate();

    return (
        <section aria-labelledby="stats-empty" className={`${PANEL} flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panelSelectedLight text-primaryLight dark:bg-panelSelectedDark dark:text-primaryDark" aria-hidden="true">
                <ChartColumn className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 id="stats-empty" className="font-libre text-base font-semibold sm:text-lg">{t("empty.title", { year })}</h2>
                <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("empty.hint")}</p>
            </div>
            <Button size="sm" leftIcon={BookOpen} onClick={() => navigate("/homepage")} className="min-h-10 shrink-0">
                {t("empty.browse")}
            </Button>
        </section>
    );
}
