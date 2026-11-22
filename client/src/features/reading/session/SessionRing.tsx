import { useTranslation } from "react-i18next";
import { formatClock } from "./useSessionClock";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC = CIRCUMFERENCE * 0.25;

export default function SessionRing({ elapsedSeconds, paused }: { elapsedSeconds: number; paused: boolean }) {
    const { t } = useTranslation("front/reading");
    const clock = formatClock(elapsedSeconds);

    return (
        <div className="relative flex h-40 w-40 items-center justify-center sm:h-52 sm:w-52">
            <svg
                viewBox="0 0 100 100"
                aria-hidden="true"
                className={`absolute inset-0 h-full w-full ${paused ? "opacity-60" : "animate-spin-calm motion-reduce:animate-pulse-soft"}`}
            >
                <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="2.5" className="stroke-panelBorderLight dark:stroke-panelBorderDark" />
                <circle
                    cx="50"
                    cy="50"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${ARC} ${CIRCUMFERENCE - ARC}`}
                    className={paused ? "stroke-secondaryLight dark:stroke-secondaryDark" : "stroke-primaryLight dark:stroke-primaryDark"}
                />
            </svg>
            <div className="flex flex-col items-center gap-1">
                <span role="timer" aria-label={t("overlay.elapsed", { time: clock })} className="font-libre text-3xl tabular-nums sm:text-4xl">
                    {clock}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
                    {t(paused ? "overlay.paused" : "overlay.reading")}
                </span>
            </div>
        </div>
    );
}
