import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookmarkPlus, BookOpen, Check } from "lucide-react";
import Button from "../../../shared/components/Button";
import { useReadingStatus } from "../../books/hooks/useReadingStatus";
import { useStartSession } from "../../reading/hooks/useSessionMutations";
import type { ChatAction, ChatBook } from "../chatbotTypes";

function Done({ children }: { children: string }) {
    return (
        <span role="status" className="flex min-h-10 items-center gap-1 px-1 text-xs text-fontMutedLight dark:text-fontMutedDark">
            <Check size={14} aria-hidden="true" />
            {children}
        </span>
    );
}

export default function ChatBookActions({ book }: { book: ChatBook }) {
    const { t } = useTranslation(["front/chatbot", "front/books"]);
    const setStatus = useReadingStatus(book.id);
    const startSession = useStartSession();
    const [shelvedOn, setShelvedOn] = useState<ChatAction["status"]>(null);
    const [started, setStarted] = useState(false);

    if (book.actions.length === 0) return null;
    if (started) return <Done>{t("actions.started")}</Done>;

    const shelfName = (status: NonNullable<ChatAction["status"]>) => t(`front/books:status.${status}`);
    const busy = setStatus.isPending || startSession.isPending;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {book.actions.map((action) => {
                if (action.type === "add_to_shelf" && action.status) {
                    const status = action.status;
                    const shelf = shelfName(status);
                    if (shelvedOn === status) return <Done key={action.type}>{t("actions.shelved", { shelf })}</Done>;
                    return (
                        <Button
                            key={action.type}
                            variant="outline"
                            size="sm"
                            leftIcon={BookmarkPlus}
                            aria-label={t("actions.shelveLabel", { shelf, title: book.title })}
                            loading={setStatus.isPending}
                            disabled={busy}
                            onClick={() => setStatus.mutate(status, { onSuccess: () => setShelvedOn(status) })}
                            className="min-h-10"
                        >
                            {shelf}
                        </Button>
                    );
                }
                return (
                    <Button
                        key={action.type}
                        variant="ghost"
                        size="sm"
                        leftIcon={BookOpen}
                        aria-label={t("actions.startLabel", { title: book.title })}
                        loading={startSession.isPending}
                        loadingText={t("actions.starting")}
                        disabled={busy}
                        onClick={() => startSession.mutate({ bookId: book.id, data: {} }, { onSuccess: () => setStarted(true) })}
                        className="min-h-10"
                    >
                        {t("actions.start")}
                    </Button>
                );
            })}
        </div>
    );
}
