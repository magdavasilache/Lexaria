import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, Flag, Maximize, Minimize, Minimize2, NotebookPen, Pause, Play } from "lucide-react";
import Button from "../buttons/Button";
import { useDialogBehavior } from "../modal/useDialogBehavior";
import { useAuthStore } from "../../api-handling/context/authentication/useAuthStore";
import { useReadingSessionStore } from "../../api-handling/context/reading/useReadingSessionStore";
import { useActiveSession } from "../../api-handling/rtk-hooks/reading/useActiveSession";
import { useTogglePause } from "../../api-handling/rtk-hooks/reading/useSessionMutations";
import { useReadingToday } from "../../api-handling/rtk-hooks/reading/useReadingGoal";
import ReadingGoalForm from "../../forms/ReadingGoalForm";
import GoalProgress from "./GoalProgress";
import type { ActiveSession } from "../../types/reading-types/readingTypes";
import ActiveSessionPill from "./ActiveSessionPill";
import EndSessionForm from "./EndSessionForm";
import SessionNoteForm from "./SessionNoteForm";
import SessionRing from "./SessionRing";
import { usesPercent } from "./progress";
import { useElapsedSeconds } from "./useSessionClock";
import { useReadingFormat } from "../../utils/useReadingFormat";
import { useFullscreen } from "./useFullscreen";
import { useWakeLock } from "./useWakeLock";

type Dialog = "end" | "note" | "goal" | null;

export default function ReadingSessionOverlay() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { data: session, dataUpdatedAt } = useActiveSession();
    if (!isAuthenticated || !session) return null;
    return <ActiveSessionView key={session.id} session={session} syncedAt={dataUpdatedAt} />;
}

function ActiveSessionView({ session, syncedAt }: { session: ActiveSession; syncedAt: number }) {
    const { t } = useTranslation("front/reading");
    const format = useReadingFormat();
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const minimized = useReadingSessionStore((state) => state.minimized);
    const setMinimized = useReadingSessionStore((state) => state.setMinimized);
    const [dialog, setDialog] = useState<Dialog>(null);
    const elapsedSeconds = useElapsedSeconds(session, syncedAt);
    const togglePause = useTogglePause();
    const { data: today } = useReadingToday();
    const fullscreen = useFullscreen(panelRef);
    const open = !minimized;

    const minimize = () => {
        fullscreen.exit();
        setMinimized(true);
    };

    const openDialog = (next: Dialog) => {
        fullscreen.exit();
        setDialog(next);
    };

    const handleKeyDown = useDialogBehavior({ open, panelRef, onEscape: dialog ? undefined : minimize });
    useWakeLock(open && !session.is_paused);

    if (!open) {
        return <ActiveSessionPill session={session} elapsedSeconds={elapsedSeconds} onOpen={() => setMinimized(false)} />;
    }

    const edition = session.reading.edition;
    const percentMode = usesPercent(session);
    const progress = session.reading.progress_percent;
    const startLabel = percentMode
        ? session.start_percent !== null && t("overlay.startedAtPercent", { percent: format.percent(session.start_percent) })
        : session.start_page !== null &&
          (edition?.pages
              ? t("overlay.startedOnPageOf", { page: session.start_page, total: edition.pages })
              : t("overlay.startedOnPage", { page: session.start_page }));
    const editionLabel = edition && format.editionTitle(edition);

    return createPortal(
        <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className="fixed inset-0 z-[70] flex flex-col bg-panelLight text-fontPrimaryLight animate-fade-in focus:outline-none dark:bg-panelDark dark:text-fontPrimaryDark"
        >
            <header className="flex items-center gap-2 bg-primaryLight px-3 py-2 text-onPrimaryLight sm:px-4 dark:bg-primaryDark dark:text-onPrimaryDark">
                <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                <h2 id={titleId} className="flex-1 truncate font-libre text-base font-semibold leading-tight">
                    {t("overlay.title")}
                </h2>
                {fullscreen.supported && (
                    <Button
                        variant="inverse"
                        icon={fullscreen.active ? Minimize : Maximize}
                        aria-label={t(fullscreen.active ? "overlay.exitFullscreen" : "overlay.fullscreen")}
                        onClick={fullscreen.toggle}
                        className="h-10 w-10"
                    />
                )}
                <Button variant="inverse" icon={Minimize2} aria-label={t("overlay.minimize")} onClick={minimize} className="h-10 w-10" />
            </header>

            <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-4 sm:gap-5 sm:p-6">
                <div className="flex w-full max-w-sm items-center gap-3">
                    {session.cover_url ? (
                        <img
                            src={session.cover_url}
                            alt={t("overlay.cover", { title: session.book_title })}
                            className="h-20 w-14 shrink-0 rounded-control object-cover shadow-book dark:shadow-bookDark"
                        />
                    ) : (
                        <span className="flex h-20 w-14 shrink-0 items-center justify-center rounded-control bg-panelSelectedLight dark:bg-panelSelectedDark" aria-hidden="true">
                            <BookOpen className="h-6 w-6 text-primaryLight dark:text-primaryDark" />
                        </span>
                    )}
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="font-libre text-lg font-semibold leading-tight break-words sm:text-xl">{session.book_title}</p>
                        {editionLabel && <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{editionLabel}</p>}
                        {startLabel && <p className="text-sm text-fontMutedLight dark:text-fontMutedDark">{startLabel}</p>}
                    </div>
                </div>

                <SessionRing elapsedSeconds={elapsedSeconds} paused={session.is_paused} />

                {progress !== null && (
                    <div className="flex w-full max-w-sm flex-col gap-1">
                        <div
                            role="progressbar"
                            aria-label={t("overlay.progressLabel")}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={progress}
                            className="h-2 w-full overflow-hidden rounded-full bg-panelSelectedLight dark:bg-panelSelectedDark"
                        >
                            <div className="h-full rounded-full bg-primaryLight transition-[width] duration-500 dark:bg-primaryDark" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-center text-xs text-fontMutedLight dark:text-fontMutedDark">
                            {t("overlay.progress", { percent: format.percent(progress) })}
                        </p>
                    </div>
                )}

                {today && (
                    <GoalProgress
                        readSeconds={today.today_seconds + elapsedSeconds}
                        goalMinutes={today.daily_reading_goal_minutes}
                        onEdit={() => openDialog("goal")}
                    />
                )}

                <div className="flex w-full max-w-sm flex-col gap-2 sm:max-w-xl sm:flex-row sm:justify-center">
                    <Button
                        leftIcon={session.is_paused ? Play : Pause}
                        onClick={() => togglePause.mutate({ session, elapsedSeconds })}
                        disabled={togglePause.isPending}
                        className="min-h-10"
                    >
                        {t(session.is_paused ? "overlay.resume" : "overlay.pause")}
                    </Button>
                    <Button variant="outline" leftIcon={NotebookPen} onClick={() => openDialog("note")} className="min-h-10">
                        {t("overlay.addNote")}
                    </Button>
                    <Button variant="secondary" leftIcon={Flag} onClick={() => openDialog("end")} className="min-h-10">
                        {t("overlay.finish")}
                    </Button>
                </div>
            </div>

            {dialog === "end" && <EndSessionForm session={session} elapsedSeconds={elapsedSeconds} onClose={() => setDialog(null)} />}
            {dialog === "note" && <SessionNoteForm session={session} onClose={() => setDialog(null)} />}
            {dialog === "goal" && <ReadingGoalForm minutes={today?.daily_reading_goal_minutes ?? null} onClose={() => setDialog(null)} />}
        </div>,
        document.body
    );
}
