import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import Button from "../../../shared/components/Button";
import { MOODS, PACES, type Mood, type Pace } from "../types/bookTypes";

type MoodChipsProps = {
    label: string;
    value: Mood[];
    onChange: (moods: Mood[]) => void;
    max?: number;
    describedBy?: string;
    invalid?: boolean;
};

export function MoodChips({ label, value, onChange, max, describedBy, invalid }: MoodChipsProps) {
    const { t } = useTranslation("front/books");
    const full = max !== undefined && value.length >= max;
    const toggle = (mood: Mood) => onChange(value.includes(mood) ? value.filter((item) => item !== mood) : [...value, mood]);

    return (
        <div role="group" aria-label={label} aria-describedby={describedBy} aria-invalid={invalid || undefined} className="flex flex-wrap gap-1.5">
            {MOODS.map((mood) => {
                const selected = value.includes(mood);
                return (
                    <Button
                        key={mood}
                        variant="chip"
                        size="sm"
                        aria-pressed={selected}
                        disabled={!selected && full}
                        rightIcon={selected ? Check : undefined}
                        onClick={() => toggle(mood)}
                        className="min-h-10"
                    >
                        {t(`moods.${mood}`)}
                    </Button>
                );
            })}
        </div>
    );
}

type PaceSegmentsProps = {
    label: string;
    value: Pace[];
    onChange: (paces: Pace[]) => void;
    single?: boolean;
};

export function PaceSegments({ label, value, onChange, single = false }: PaceSegmentsProps) {
    const { t } = useTranslation("front/books");
    const toggle = (pace: Pace) => {
        if (value.includes(pace)) onChange(value.filter((item) => item !== pace));
        else onChange(single ? [pace] : [...value, pace]);
    };

    return (
        <div role="group" aria-label={label} className="flex w-full sm:max-w-xs lg:max-w-none overflow-hidden rounded-control border border-primaryLight dark:border-primaryDark divide-x divide-primaryLight/40 dark:divide-primaryDark/40">
            {PACES.map((pace) => (
                <Button key={pace} variant="segment" size="sm" aria-pressed={value.includes(pace)} onClick={() => toggle(pace)} className="min-h-10">
                    {t(`paces.${pace}`)}
                </Button>
            ))}
        </div>
    );
}
