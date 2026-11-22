import { useTranslation } from "react-i18next";
import { BookOpen, Pause } from "lucide-react";
import Button from "../../../shared/components/Button";
import type { ActiveSession } from "../types/readingTypes";
import { formatClock } from "./useSessionClock";

type Props = {
    session: ActiveSession;
    elapsedSeconds: number;
    onOpen: () => void;
};

export default function ActiveSessionPill({ session, elapsedSeconds, onOpen }: Props) {
    const { t } = useTranslation("front/reading");

    return (
        <div className="fixed bottom-4 left-4 right-20 z-[60] animate-slide-up sm:right-auto">
            <Button
                leftIcon={session.is_paused ? Pause : BookOpen}
                onClick={onOpen}
                fullWidth
                className="min-h-10 shadow-soft-lg dark:shadow-deep-lg sm:w-auto sm:max-w-xs [&>span]:min-w-0"
            >
                <span className="sr-only">{t("pill.open")}</span>
                <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{session.book_title}</span>
                    <span className="shrink-0 tabular-nums">{session.is_paused ? t("overlay.paused") : formatClock(elapsedSeconds)}</span>
                </span>
            </Button>
        </div>
    );
}
