import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, BookCheck, BookX, Bookmark, LucideIcon, NotebookPen, PencilLine, Play, Timer } from "lucide-react";
import Button from "../../../../global-components/buttons/Button";
import ReadingEditForm from "../../../../forms/ReadingEditForm";
import { useJourney } from "../../../../api-handling/rtk-hooks/reading/useJourney";
import type { JourneyEntry, JourneyReading, Reading, ReadingEvent, ReadingEventType, ReadingState } from "../../../../types/reading-types/readingTypes";
import { useReadingFormat } from "../../../../utils/useReadingFormat";
import NoteEntry from "./NoteEntry";

const PANEL = "rounded-panel border border-panelBorderLight bg-panelLight shadow-soft-md dark:border-panelBorderDark dark:bg-panelDark dark:shadow-deep-md";
const HEADING = "text-xs font-semibold uppercase tracking-wider text-fontMutedLight dark:text-fontMutedDark";
const BADGE = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panelSelectedLight text-primaryLight dark:bg-panelSelectedDark dark:text-primaryDark";

const STATE_COLORS: Record<ReadingState, string> = {
    active: "bg-statusCurrentlyReadingLight text-statusCurrentlyReadingTextLight dark:bg-statusCurrentlyReadingDark dark:text-statusCurrentlyReadingTextDark",
    finished: "bg-statusReadLight text-statusReadTextLight dark:bg-statusReadDark dark:text-statusReadTextDark",
    abandoned: "bg-statusDidNotFinishLight text-statusDidNotFinishTextLight dark:bg-statusDidNotFinishDark dark:text-statusDidNotFinishTextDark",
};

const EVENT_ICONS: Record<ReadingEventType, LucideIcon> = {
    shelved: Bookmark,
    started: Play,
    note: NotebookPen,
    finished: BookCheck,
    abandoned: BookX,
    edition_changed: ArrowLeftRight,
};

export default function ReadingJourney({ bookId }: { bookId: number }) {
    const { t } = useTranslation("front/reading");
    const { data: journey } = useJourney(bookId);
    const [editing, setEditing] = useState<Reading | null>(null);

    if (!journey || (journey.readings.length === 0 && journey.shelf_history.length === 0)) return null;

    return (
        <section aria-labelledby="reading-journey" className={`${PANEL} flex flex-col divide-y divide-panelBorderLight dark:divide-panelBorderDark`}>
            <header className="p-4 sm:px-6">
                <h2 id="reading-journey" className="font-libre text-lg font-semibold sm:text-xl">{t("journey.title")}</h2>
            </header>
            {journey.readings.map((item, index) => (
                <ReadThrough
                    key={item.reading.id}
                    bookId={bookId}
                    item={item}
                    number={journey.readings.length - index}
                    onEdit={() => setEditing(item.reading)}
                />
            ))}
            {journey.shelf_history.length > 0 && <ShelfHistory events={journey.shelf_history} />}
            {editing && <ReadingEditForm reading={editing} onClose={() => setEditing(null)} />}
        </section>
    );
}

function ReadThrough({ bookId, item, number, onEdit }: { bookId: number; item: JourneyReading; number: number; onEdit: () => void }) {
    const { t } = useTranslation("front/reading");
    const format = useReadingFormat();
    const { reading } = item;
    const dates = [
        t("journey.startedOn", { date: format.date(reading.started_at) }),
        reading.finished_at ? t(reading.state === "finished" ? "journey.finishedOn" : "journey.stoppedOn", { date: format.date(reading.finished_at) }) : null,
    ].filter(Boolean).join(" · ");
    const totals = [
        { label: t("journey.totals.time"), value: format.duration(reading.total_seconds) },
        { label: t("journey.totals.sessions"), value: String(reading.sessions_count) },
        item.pages_read !== null ? { label: t("journey.totals.pages"), value: String(item.pages_read) } : null,
        item.pages_per_hour !== null ? { label: t("journey.totals.pace"), value: new Intl.NumberFormat(format.language).format(item.pages_per_hour) } : null,
    ].filter((total): total is { label: string; value: string } => total !== null);

    return (
        <article className="flex flex-col gap-3 p-4 sm:px-6">
            <header className="flex flex-wrap items-start gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-libre text-base font-semibold">{t("journey.readThrough", { number })}</h3>
                        <span className={`rounded-control px-2 py-0.5 text-xs font-medium ${STATE_COLORS[reading.state]}`}>{t(`states.${reading.state}`)}</span>
                    </div>
                    <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{dates}</p>
                    {reading.edition && <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{format.editionTitle(reading.edition)}</p>}
                </div>
                <Button variant="outline" size="sm" leftIcon={PencilLine} onClick={onEdit} className="min-h-10">
                    {t("journey.edit")}
                </Button>
            </header>

            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {totals.map(({ label, value }) => (
                    <div key={label} className="flex flex-col rounded-control bg-panelSelectedLight/60 px-3 py-2 dark:bg-panelSelectedDark">
                        <dt className="text-xs text-fontMutedLight dark:text-fontMutedDark">{label}</dt>
                        <dd className="font-semibold tabular-nums">{value}</dd>
                    </div>
                ))}
            </dl>

            {item.entries.length > 0 && (
                <ol aria-label={t("journey.timeline", { number })} className="flex flex-col divide-y divide-panelBorderLight dark:divide-panelBorderDark">
                    {item.entries.map((entry) => (
                        <li key={`${entry.kind}-${entry.kind === "event" ? entry.event.id : entry.session.id}`} className="flex items-start gap-3 py-2.5">
                            <Entry bookId={bookId} entry={entry} />
                        </li>
                    ))}
                </ol>
            )}
        </article>
    );
}

function Entry({ bookId, entry }: { bookId: number; entry: JourneyEntry }) {
    const { t } = useTranslation("front/reading");
    const format = useReadingFormat();
    const when = format.dateTime(entry.at);

    if (entry.kind === "session") {
        const { session } = entry;
        const range =
            session.start_page !== null && session.end_page !== null
                ? t("journey.pageRange", { from: session.start_page, to: session.end_page })
                : session.start_percent !== null && session.end_percent !== null
                    ? t("journey.percentRange", { from: format.percent(session.start_percent), to: format.percent(session.end_percent) })
                    : null;
        return (
            <>
                <span className={BADGE} aria-hidden="true"><Timer className="h-4 w-4" /></span>
                <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-sm">
                        {session.duration_seconds === null ? t("journey.sessionRunning") : t("journey.session", { duration: format.duration(session.duration_seconds) })}
                    </p>
                    <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{[range, when].filter(Boolean).join(" · ")}</p>
                </div>
            </>
        );
    }

    const { event } = entry;
    const Icon = EVENT_ICONS[event.type];
    const progress =
        event.page !== null
            ? t("journey.atPage", { page: event.page })
            : event.percent !== null
                ? t("journey.atPercent", { percent: format.percent(event.percent) })
                : null;
    const meta = [progress, when].filter(Boolean).join(" · ");

    return (
        <>
            <span className={BADGE} aria-hidden="true"><Icon className="h-4 w-4" /></span>
            {event.type === "note" ? (
                <NoteEntry bookId={bookId} note={event} meta={meta} />
            ) : (
                <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-sm">{t(`journey.events.${event.type}`)}</p>
                    <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">{meta}</p>
                </div>
            )}
        </>
    );
}

function ShelfHistory({ events }: { events: ReadingEvent[] }) {
    const { t } = useTranslation(["front/reading", "front/books"]);
    const format = useReadingFormat();

    return (
        <section className="flex flex-col gap-2 p-4 sm:px-6">
            <h3 className={HEADING}>{t("journey.shelfHistory")}</h3>
            <ol className="flex flex-col divide-y divide-panelBorderLight dark:divide-panelBorderDark">
                {events.map((event) => (
                    <li key={event.id} className="flex items-center gap-3 py-2">
                        <span className={BADGE} aria-hidden="true"><Bookmark className="h-4 w-4" /></span>
                        <p className="min-w-0 flex-1 text-sm">
                            {event.status ? t("journey.shelved", { status: t(`front/books:status.${event.status}`) }) : t("journey.events.shelved")}
                        </p>
                        <span className="shrink-0 text-xs text-fontMutedLight dark:text-fontMutedDark">{format.date(event.occurred_at)}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
}
