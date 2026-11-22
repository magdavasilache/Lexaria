import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Timer } from "lucide-react";
import Button from "../../../shared/components/Button";
import EditionForm from "./EditionForm";
import { useReadingSessionStore } from "../stores/useReadingSessionStore";
import { useActiveSession } from "../hooks/useActiveSession";
import { useStartSession } from "../hooks/useSessionMutations";
import type { Edition } from "../types/editionTypes";
import type { Reading } from "../types/readingTypes";
import EditionPicker from "./EditionPicker";

const LAYOUT = "mx-auto min-h-10 max-w-xs justify-center md:mx-0";

type Step = { kind: "pick" } | { kind: "add" } | { kind: "edit"; edition: Edition } | null;

export default function StartSessionButton({ bookId, reading }: { bookId: number; reading: Reading | null }) {
    const { t } = useTranslation("front/reading");
    const { data: session, isLoading } = useActiveSession();
    const startSession = useStartSession();
    const setMinimized = useReadingSessionStore((state) => state.setMinimized);
    const [step, setStep] = useState<Step>(null);
    const [preselectedId, setPreselectedId] = useState<number | null>(null);

    if (session && session.book_id === bookId) {
        return (
            <Button variant="outline" fullWidth leftIcon={Timer} onClick={() => setMinimized(false)} className={LAYOUT}>
                {t("start.return")}
            </Button>
        );
    }

    const start = () => {
        if (reading?.edition_id) startSession.mutate({ bookId, data: {} });
        else setStep({ kind: "pick" });
    };

    return (
        <div className="mx-auto flex w-full max-w-xs flex-col gap-1 md:mx-0">
            <Button
                fullWidth
                leftIcon={BookOpen}
                onClick={start}
                disabled={isLoading || Boolean(session)}
                loading={startSession.isPending}
                loadingText={t("start.starting")}
                className={LAYOUT}
            >
                {t("start.button")}
            </Button>
            {session && (
                <p className="text-center text-xs text-fontMutedLight md:text-left dark:text-fontMutedDark">
                    {t("start.otherSession", { title: session.book_title })}
                </p>
            )}
            {step?.kind === "pick" && (
                <EditionPicker
                    bookId={bookId}
                    reading={reading}
                    preselectedId={preselectedId}
                    onAddEdition={() => setStep({ kind: "add" })}
                    onEditEdition={(edition) => setStep({ kind: "edit", edition })}
                    onClose={() => setStep(null)}
                />
            )}
            {(step?.kind === "add" || step?.kind === "edit") && (
                <EditionForm
                    bookId={bookId}
                    edition={step.kind === "edit" ? step.edition : undefined}
                    onClose={() => setStep({ kind: "pick" })}
                    onSaved={(edition) => {
                        setPreselectedId(edition.id);
                        setStep({ kind: "pick" });
                    }}
                />
            )}
        </div>
    );
}
