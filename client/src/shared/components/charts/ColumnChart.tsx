import { useState } from "react";
import MarkTooltip from "./MarkTooltip";

export type ColumnDatum = {
    key: string | number;
    value: number;
    valueText: string;
    label: string;
    axisLabel: string;
    compactAxisLabel?: string;
    ariaLabel: string;
};

type Props = {
    data: ColumnDatum[];
    labelledBy: string;
    formatTick: (value: number) => string;
    empty: string;
};

const TICK_COUNT = 3;

const niceStep = (max: number) => {
    const raw = max / TICK_COUNT;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= raw) ?? raw;
    return Math.max(step, 1);
};

export default function ColumnChart({ data, labelledBy, formatTick, empty }: Props) {
    const [active, setActive] = useState<number | null>(null);
    const max = Math.max(0, ...data.map((datum) => datum.value));

    if (max === 0) {
        return (
            <p className="flex h-40 items-center justify-center rounded-panel bg-panelHoverLight/60 px-4 text-center text-sm text-fontMutedLight dark:bg-panelHoverDark/40 dark:text-fontMutedDark sm:h-48">
                {empty}
            </p>
        );
    }

    const step = niceStep(max);
    const top = Math.max(step, Math.ceil(max / step) * step);
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step);

    return (
        <div className="flex gap-2">
            <div className="relative h-40 w-8 shrink-0 sm:h-48 sm:w-10" aria-hidden="true">
                {ticks.map((tick) => (
                    <span
                        key={tick}
                        className="absolute right-0 translate-y-1/2 text-[0.7rem] tabular-nums text-fontMutedLight dark:text-fontMutedDark"
                        style={{ bottom: `${(tick / top) * 100}%` }}
                    >
                        {formatTick(tick)}
                    </span>
                ))}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="relative h-40 sm:h-48">
                    {ticks.map((tick) => (
                        <span
                            key={tick}
                            aria-hidden="true"
                            className="absolute inset-x-0 h-px bg-dividerLight dark:bg-dividerDark"
                            style={{ bottom: `${(tick / top) * 100}%` }}
                        />
                    ))}
                    <ol aria-labelledby={labelledBy} className="relative flex h-full items-end gap-0.5" onMouseLeave={() => setActive(null)}>
                        {data.map((datum, index) => {
                            const isActive = active === index;
                            const height = `${(datum.value / top) * 100}%`;
                            return (
                                <li
                                    key={datum.key}
                                    tabIndex={0}
                                    aria-label={datum.ariaLabel}
                                    onMouseEnter={() => setActive(index)}
                                    onFocus={() => setActive(index)}
                                    onBlur={() => setActive(null)}
                                    className="group relative flex h-full min-w-0 flex-1 items-end justify-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryLight dark:focus-visible:ring-primaryDark"
                                >
                                    {datum.value > 0 && (
                                        <span
                                            aria-hidden="true"
                                            className={`w-full max-w-6 rounded-t-control bg-chartLight transition-[height,filter] duration-300 dark:bg-chartDark ${isActive ? "brightness-110" : ""}`}
                                            style={{ height }}
                                        />
                                    )}
                                    {isActive && <MarkTooltip value={datum.valueText} label={datum.label} index={index} count={data.length} bottom={height} />}
                                </li>
                            );
                        })}
                    </ol>
                </div>
                <div className="flex gap-0.5" aria-hidden="true">
                    {data.map((datum) => (
                        <span key={datum.key} className="min-w-0 flex-1 truncate text-center text-[0.7rem] text-fontMutedLight dark:text-fontMutedDark">
                            {datum.compactAxisLabel ? (
                                <>
                                    <span className="sm:hidden">{datum.compactAxisLabel}</span>
                                    <span className="hidden sm:inline">{datum.axisLabel}</span>
                                </>
                            ) : (
                                datum.axisLabel
                            )}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
