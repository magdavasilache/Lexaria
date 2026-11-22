export type BarDatum = { id: string | number; label: string; value: number; valueText: string; ariaLabel: string };

export default function BarList({ items }: { items: BarDatum[] }) {
    const max = Math.max(1, ...items.map((item) => item.value));

    return (
        <ol className="flex flex-col gap-3">
            {items.map((item) => (
                <li key={item.id} aria-label={item.ariaLabel} className="flex flex-col gap-1">
                    <span aria-hidden="true" className="truncate text-sm">{item.label}</span>
                    <span aria-hidden="true" className="flex items-center gap-2">
                        <span className="h-2 min-w-0 flex-1">
                            <span className="block h-full rounded-r-control bg-chartLight dark:bg-chartDark" style={{ width: `${(item.value / max) * 100}%` }} />
                        </span>
                        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">{item.valueText}</span>
                    </span>
                </li>
            ))}
        </ol>
    );
}
