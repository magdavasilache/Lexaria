import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import Button from "../../../../global-components/buttons/Button";
import EditionForm from "../../../../forms/EditionForm";
import { useAuthStore } from "../../../../api-handling/context/authentication/useAuthStore";
import { USER_ROLE } from "../../../../types/auth-types/userTypes";
import type { Reading } from "../../../../types/reading-types/readingTypes";
import { useReadingFormat } from "../../../../utils/useReadingFormat";

export default function ReadingProgress({ reading }: { reading: Reading }) {
    const { t } = useTranslation("front/reading");
    const format = useReadingFormat();
    const progress = format.progress(reading);
    const user = useAuthStore((state) => state.user);
    const [editing, setEditing] = useState(false);
    const edition = reading.edition;
    const canEdit = Boolean(edition && user && (edition.created_by_id === user.id || user.role === USER_ROLE.ADMIN));

    return (
        <section
            aria-label={t("progress.label")}
            className="mx-auto flex w-full max-w-xs flex-col gap-1.5 rounded-panel border border-panelBorderLight bg-panelLight px-3 py-2 text-sm shadow-soft-sm md:mx-0 dark:border-panelBorderDark dark:bg-panelDark dark:shadow-deep-sm"
        >
            {edition && (
                <div className="flex items-center gap-1">
                    <p className="min-w-0 flex-1 truncate font-semibold">{format.editionTitle(edition)}</p>
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Pencil}
                            aria-label={t("picker.editEdition", { edition: format.editionTitle(edition) })}
                            onClick={() => setEditing(true)}
                            className="-my-1 h-10 w-10 shrink-0"
                        />
                    )}
                </div>
            )}
            {reading.progress_percent !== null && (
                <div
                    role="progressbar"
                    aria-label={t("progress.label")}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={reading.progress_percent}
                    className="h-2 w-full overflow-hidden rounded-full bg-panelSelectedLight dark:bg-panelSelectedDark"
                >
                    <div className="h-full rounded-full bg-primaryLight dark:bg-primaryDark" style={{ width: `${reading.progress_percent}%` }} />
                </div>
            )}
            <p className="text-fontMutedLight dark:text-fontMutedDark">{progress || t("progress.notStarted")}</p>
            {reading.sessions_count > 0 && (
                <p className="text-xs text-fontMutedLight dark:text-fontMutedDark">
                    {t("progress.timeRead", { count: reading.sessions_count, duration: format.duration(reading.total_seconds) })}
                </p>
            )}
            {editing && edition && (
                <EditionForm bookId={reading.book_id} edition={edition} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
            )}
        </section>
    );
}
