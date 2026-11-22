const EDGE_MARKS = 2;

type Props = { value: string; label: string; index: number; count: number; bottom?: string };

export default function MarkTooltip({ value, label, index, count, bottom = "100%" }: Props) {
    const align = index < EDGE_MARKS ? "left-0" : index >= count - EDGE_MARKS ? "right-0" : "left-1/2 -translate-x-1/2";

    return (
        <span
            aria-hidden="true"
            className={`pointer-events-none absolute z-10 mb-1 flex w-max max-w-[9rem] flex-col rounded-control border border-panelBorderLight bg-surfaceRaisedLight px-2 py-1 shadow-soft-md dark:border-panelBorderDark dark:bg-surfaceDark dark:shadow-deep-md ${align}`}
            style={{ bottom }}
        >
            <span className="text-sm font-semibold">{value}</span>
            <span className="text-xs text-fontMutedLight dark:text-fontMutedDark">{label}</span>
        </span>
    );
}
