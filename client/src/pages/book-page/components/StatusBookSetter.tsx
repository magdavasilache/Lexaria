import { useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../../../global-components/buttons/Button";
import { ReadingStatus, useUserBookStatus } from "../../../api-handling/rtk-hooks/useUserBookStatus";

const STATUSES: ReadingStatus[] = ["want_to_read", "currently_reading", "read", "did_not_finish"];

const STATUS_COLORS: Record<ReadingStatus, string> = {
    want_to_read: "bg-statusWantToReadLight text-statusWantToReadTextLight dark:bg-statusWantToReadDark dark:text-statusWantToReadTextDark",
    currently_reading: "bg-statusCurrentlyReadingLight text-statusCurrentlyReadingTextLight dark:bg-statusCurrentlyReadingDark dark:text-statusCurrentlyReadingTextDark",
    read: "bg-statusReadLight text-statusReadTextLight dark:bg-statusReadDark dark:text-statusReadTextDark",
    did_not_finish: "bg-statusDidNotFinishLight text-statusDidNotFinishTextLight dark:bg-statusDidNotFinishDark dark:text-statusDidNotFinishTextDark",
};

const isReadingStatus = (value: string | undefined): value is ReadingStatus => STATUSES.includes(value as ReadingStatus);

interface Props {
    bookId: number;
    status: string | undefined;
}

export default function StatusBookSetter({ bookId, status }: Props) {
    const { t } = useTranslation("front/books");
    const menuId = useId();
    const [open, setOpen] = useState(false);
    const setStatus = useUserBookStatus();
    const current = isReadingStatus(status) ? status : null;

    const choose = (next: ReadingStatus) => {
        setStatus.mutate({ book_id: bookId, status: next });
        setOpen(false);
    };

    return (
        <div className="w-full max-w-xs mx-auto lg:mx-0">
            <Button
                variant="outline"
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
                <ul id={menuId} className="mt-1 flex flex-col overflow-hidden rounded-panel border border-panelBorderLight dark:border-panelBorderDark bg-panelLight dark:bg-panelDark animate-slide-down">
                    {STATUSES.map((value) => (
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
                </ul>
            )}
        </div>
    );
}
