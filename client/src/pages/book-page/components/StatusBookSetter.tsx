import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { BookmarkX, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../global-components/buttons/Button";
import { useReadingStatus } from "../../../api-handling/rtk-hooks/books/useReadingStatus";
import { READING_STATUSES, ReadingStatus } from "../../../types/user-book-status-types/UserBookStatusTypes";

const STATUS_COLORS: Record<ReadingStatus, string> = {
    want_to_read: "bg-statusWantToReadLight text-statusWantToReadTextLight dark:bg-statusWantToReadDark dark:text-statusWantToReadTextDark",
    currently_reading: "bg-statusCurrentlyReadingLight text-statusCurrentlyReadingTextLight dark:bg-statusCurrentlyReadingDark dark:text-statusCurrentlyReadingTextDark",
    read: "bg-statusReadLight text-statusReadTextLight dark:bg-statusReadDark dark:text-statusReadTextDark",
    did_not_finish: "bg-statusDidNotFinishLight text-statusDidNotFinishTextLight dark:bg-statusDidNotFinishDark dark:text-statusDidNotFinishTextDark",
};

interface Props {
    bookId: number;
    status: ReadingStatus | undefined;
}

export default function StatusBookSetter({ bookId, status }: Props) {
    const { t } = useTranslation("front/books");
    const menuId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    const setStatus = useReadingStatus(bookId);
    const current = status ?? null;

    useEffect(() => {
        if (!open) return;
        const closeOutside = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("pointerdown", closeOutside);
        return () => document.removeEventListener("pointerdown", closeOutside);
    }, [open]);

    const close = () => {
        setOpen(false);
        triggerRef.current?.focus();
    };

    const choose = (next: ReadingStatus | null) => {
        if (next !== current) setStatus.mutate(next);
        close();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape" && open) {
            event.stopPropagation();
            close();
        }
    };

    return (
        <div ref={rootRef} onKeyDown={handleKeyDown} className="relative mx-auto w-full max-w-xs md:mx-0">
            <Button
                ref={triggerRef}
                variant={current ? "outline" : "field"}
                fullWidth
                rightIcon={ChevronDown}
                iconClassName={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                aria-expanded={open}
                aria-controls={menuId}
                loading={setStatus.isPending}
                onClick={() => setOpen((value) => !value)}
                className={`min-h-10 justify-between ${current ? STATUS_COLORS[current] : ""}`}
            >
                {current ? t(`status.${current}`) : t("status.add")}
            </Button>

            {open && (
                <ul
                    id={menuId}
                    className="absolute inset-x-0 top-full z-30 mt-1 flex flex-col overflow-hidden rounded-panel border border-panelBorderLight bg-panelLight shadow-soft-lg animate-slide-down dark:border-panelBorderDark dark:bg-panelDark dark:shadow-deep-lg"
                >
                    {READING_STATUSES.map((value) => (
                        <li key={value}>
                            <Button
                                variant="menu"
                                fullWidth
                                aria-pressed={current === value}
                                rightIcon={current === value ? Check : undefined}
                                onClick={() => choose(value)}
                                className={`min-h-10 justify-between ${current === value ? STATUS_COLORS[value] : ""}`}
                            >
                                {t(`status.${value}`)}
                            </Button>
                        </li>
                    ))}
                    {current && (
                        <li className="border-t border-dividerLight dark:border-dividerDark">
                            <Button variant="menuDanger" fullWidth leftIcon={BookmarkX} onClick={() => choose(null)} className="min-h-10">
                                {t("status.remove")}
                            </Button>
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
