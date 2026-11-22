import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PencilLine, Sparkles } from "lucide-react";
import Button from "../../../shared/components/Button";
import type { ReaderSignals } from "../types/bookTypes";
import type { ReadingStatus } from "../types/UserBookStatusTypes";
import ReaderVoteModal from "./ReaderVoteModal";

const MOODS_SHOWN = 6;
const VOTING_STATUSES: readonly ReadingStatus[] = ["currently_reading", "read", "did_not_finish"];
const PACE_TONES = {
    slow: "bg-primaryLight/35 dark:bg-primaryDark/35",
    medium: "bg-primaryLight/65 dark:bg-primaryDark/65",
    fast: "bg-primaryLight dark:bg-primaryDark",
} as const;

type Props = {
    bookId: number;
    title: string;
    signals: ReaderSignals;
    status: ReadingStatus | null;
};

export default function ReaderSignalsPanel({ bookId, title, signals, status }: Props) {
    const { t, i18n } = useTranslation("front/books");
    const [voting, setVoting] = useState(false);
    const percent = new Intl.NumberFormat(i18n.resolvedLanguage, { style: "percent", maximumFractionDigits: 0 });
    const canVote = status !== null && VOTING_STATUSES.includes(status);
    const hasVote = signals.my_moods.length > 0 || signals.my_pace !== null;
    const moods = signals.moods.slice(0, MOODS_SHOWN);
    const paceVotes = signals.paces.reduce((total, pace) => total + pace.votes, 0);

    return (
        <section
            aria-labelledby="reader-signals-heading"
            className="flex w-full flex-col gap-3 rounded-panel border border-panelBorderLight bg-panelLight p-4 text-fontPrimaryLight shadow-soft-md dark:border-panelBorderDark dark:bg-panelDark dark:text-fontPrimaryDark dark:shadow-deep-md sm:p-5"
        >
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                <h2 id="reader-signals-heading" className="text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark">
                    {t("signals.title")}
                </h2>
                {signals.mood_voters > 0 && (
                    <span className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("signals.voters", { count: signals.mood_voters })}</span>
                )}
            </div>

            {moods.length === 0 && paceVotes === 0 && (
                <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{t("signals.empty")}</p>
            )}

            {moods.length > 0 && (
                <ul className="flex flex-col gap-2">
                    {moods.map(({ mood, share }) => (
                        <li key={mood} className="flex flex-col gap-1">
                            <div className="flex items-baseline justify-between gap-2 text-sm">
                                <span>{t(`moods.${mood}`)}</span>
                                <span className="text-xs tabular-nums text-fontMutedLight dark:text-fontMutedDark">{percent.format(share)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-panelSelectedLight dark:bg-panelSelectedDark" aria-hidden="true">
                                <div className="h-full rounded-full bg-primaryLight dark:bg-primaryDark" style={{ width: `${share * 100}%` }} />
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {paceVotes > 0 && (
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-sm">
                        {signals.pace ? t("signals.paceSummary", { pace: t(`pacesInline.${signals.pace}`) }) : t("signals.paceLabel")}
                    </h3>
                    <div className="flex h-2 overflow-hidden rounded-full bg-panelSelectedLight dark:bg-panelSelectedDark" aria-hidden="true">
                        {signals.paces.map(({ pace, share }) => (
                            <div key={pace} className={PACE_TONES[pace]} style={{ width: `${share * 100}%` }} />
                        ))}
                    </div>
                    <ul className="flex flex-wrap justify-between gap-x-3 text-xs text-fontMutedLight dark:text-fontMutedDark">
                        {signals.paces.map(({ pace, share }) => (
                            <li key={pace}>
                                {t(`paces.${pace}`)} <span className="tabular-nums">{percent.format(share)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {canVote ? (
                <Button variant="outline" size="sm" fullWidth leftIcon={hasVote ? PencilLine : Sparkles} onClick={() => setVoting(true)} className="min-h-10">
                    {t(hasVote ? "signals.editVote" : "signals.vote")}
                </Button>
            ) : (
                <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{t("signals.voteHint")}</p>
            )}

            {voting && <ReaderVoteModal bookId={bookId} title={title} signals={signals} onClose={() => setVoting(false)} />}
        </section>
    );
}
