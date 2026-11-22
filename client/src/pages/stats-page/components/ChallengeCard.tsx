import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CircleCheck, CircleX, LucideIcon, Pencil, Plus, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import Button from "../../../global-components/buttons/Button";
import ChallengeForm from "../../../forms/ChallengeForm";
import type { ChallengeProgress, PaceStatus, TargetProgress } from "../../../types/stats-types/statsTypes";
import { useStatsFormat } from "../useStatsFormat";
import { CARD_TITLE, HINT, LABEL, PANEL } from "./styles";

const PACE_ICONS: Record<PaceStatus, LucideIcon> = {
    completed: Trophy,
    ahead: TrendingUp,
    on_track: CircleCheck,
    behind: TrendingDown,
    missed: CircleX,
};

const SHORTFALL: ReadonlySet<PaceStatus> = new Set(["behind", "missed"]);

const showsPaceTick = (target: TargetProgress) => target.status !== "completed" && target.status !== "missed" && target.expected > 0;

export default function ChallengeCard({ year, progress }: { year: number; progress: ChallengeProgress | null }) {
    const { t } = useTranslation("front/stats");
    const [editing, setEditing] = useState(false);
    const hasTick = progress?.targets.some(showsPaceTick) ?? false;

    return (
        <section aria-labelledby="stats-challenge" className={`${PANEL} flex flex-col gap-4 p-4 sm:p-5`}>
            <header className="flex flex-wrap items-center gap-2">
                <Trophy className="h-5 w-5 shrink-0 text-primaryLight dark:text-primaryDark" aria-hidden="true" />
                <h2 id="stats-challenge" className={`${CARD_TITLE} min-w-0 flex-1`}>{t("challenge.title", { year })}</h2>
                {progress && (
                    <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => setEditing(true)} className="min-h-10">
                        {t("challenge.edit")}
                    </Button>
                )}
            </header>

            {progress ? (
                <>
                    <ul className="flex flex-col gap-4">
                        {progress.targets.map((target) => (
                            <TargetMeter key={target.metric} target={target} />
                        ))}
                    </ul>
                    {hasTick && <p className={HINT}>{t("challenge.paceKey")}</p>}
                </>
            ) : (
                <div className="flex flex-col items-start gap-3">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">{t("challenge.empty", { year })}</p>
                        <p className={HINT}>{t("challenge.emptyHint")}</p>
                    </div>
                    <Button size="sm" leftIcon={Plus} onClick={() => setEditing(true)} className="min-h-10">
                        {t("challenge.set")}
                    </Button>
                </div>
            )}

            {editing && <ChallengeForm year={year} challenge={progress?.challenge ?? null} onClose={() => setEditing(false)} />}
        </section>
    );
}

function TargetMeter({ target }: { target: TargetProgress }) {
    const { t } = useTranslation("front/stats");
    const format = useStatsFormat();
    const digits = format.metricDigits(target.metric);
    const share = Math.min(1, target.value / target.target);
    const tick = Math.min(1, target.expected / target.target);
    const shortfall = SHORTFALL.has(target.status);
    const Icon = PACE_ICONS[target.status];
    const gap = Math.max(10 ** -digits, Math.abs(target.status === "missed" ? target.target - target.value : target.expected - target.value));
    const paceText = target.status === "on_track" || target.status === "completed"
        ? t(`pace.${target.status}`)
        : t(`pace.${target.status}`, { amount: format.amount(target.metric, gap) });
    const labelId = `challenge-${target.metric}`;

    return (
        <li className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
                <span id={labelId} className={LABEL}>{t(`metrics.${target.metric}`)}</span>
                <span className="font-sans text-sm font-semibold tabular-nums">
                    {t("challenge.valueOfTarget", { value: format.number(target.value, digits), target: format.number(target.target) })}
                </span>
            </div>
            <div
                role="progressbar"
                aria-labelledby={labelId}
                aria-valuemin={0}
                aria-valuemax={target.target}
                aria-valuenow={Math.min(target.value, target.target)}
                aria-valuetext={`${t("challenge.meterText", { value: format.amount(target.metric, target.value), target: format.number(target.target) })}. ${paceText}`}
                className="relative h-2 w-full rounded-full bg-primaryLight/15 dark:bg-primaryDark/20"
            >
                <div
                    className={`h-full rounded-full transition-[width] duration-500 ${shortfall ? "bg-warningSolidLight dark:bg-warningSolidDark" : "bg-primaryLight dark:bg-primaryDark"}`}
                    style={{ width: `${share * 100}%` }}
                />
                {showsPaceTick(target) && (
                    <span
                        aria-hidden="true"
                        className="absolute -top-1 h-4 w-0.5 -translate-x-1/2 rounded-full bg-fontPrimaryLight dark:bg-fontPrimaryDark"
                        style={{ left: `${tick * 100}%` }}
                    />
                )}
            </div>
            <p className={`flex items-center gap-1.5 text-xs ${shortfall ? "text-warningTextLight dark:text-warningTextDark" : "text-fontMutedLight dark:text-fontMutedDark"}`}>
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {paceText}
            </p>
        </li>
    );
}
