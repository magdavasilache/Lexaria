import { useTranslation } from "react-i18next";
import { CircleCheck, Pencil, Target } from "lucide-react";
import Button from "../../../shared/components/Button";

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = {
    readSeconds: number;
    goalMinutes: number | null;
    onEdit: () => void;
};

export default function GoalProgress({ readSeconds, goalMinutes, onEdit }: Props) {
    const { t } = useTranslation("front/reading");
    const minutes = Math.floor(readSeconds / 60);

    if (goalMinutes === null) {
        return (
            <Button variant="link" size="sm" leftIcon={Target} onClick={onEdit} className="min-h-10">
                {t("goal.set")}
            </Button>
        );
    }

    const ratio = Math.min(1, minutes / goalMinutes);
    const reached = minutes >= goalMinutes;

    return (
        <div className="flex items-center gap-3">
            <svg
                viewBox="0 0 48 48"
                role="progressbar"
                aria-label={t("goal.label")}
                aria-valuemin={0}
                aria-valuemax={goalMinutes}
                aria-valuenow={Math.min(minutes, goalMinutes)}
                className="h-12 w-12 shrink-0 -rotate-90"
            >
                <circle cx="24" cy="24" r={RADIUS} fill="none" strokeWidth="4" className="stroke-panelSelectedLight dark:stroke-panelSelectedDark" />
                <circle
                    cx="24"
                    cy="24"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${CIRCUMFERENCE * ratio} ${CIRCUMFERENCE}`}
                    className={`transition-[stroke-dasharray] duration-500 ${reached ? "stroke-successLight dark:stroke-successDark" : "stroke-secondaryLight dark:stroke-secondaryDark"}`}
                />
            </svg>
            <div className="flex flex-col">
                <span className="text-sm font-semibold tabular-nums">{t("goal.progress", { minutes, goal: goalMinutes })}</span>
                {reached && (
                    <span className="inline-flex items-center gap-1 text-xs text-successTextLight dark:text-successTextDark">
                        <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("goal.reached")}
                    </span>
                )}
            </div>
            <Button variant="ghost" size="sm" icon={Pencil} aria-label={t("goal.edit")} onClick={onEdit} className="h-10 w-10" />
        </div>
    );
}
