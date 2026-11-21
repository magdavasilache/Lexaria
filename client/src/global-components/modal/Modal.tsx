import { KeyboardEvent, ReactNode, RefObject, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { LucideIcon, X } from "lucide-react";
import Button from "../buttons/Button";

export type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    description?: ReactNode;
    icon?: LucideIcon;
    children: ReactNode;
    footer?: ReactNode;
    size?: ModalSize;
    dismissible?: boolean;
    unsavedChanges?: boolean;
    initialFocusRef?: RefObject<HTMLElement | null>;
    bodyClassName?: string;
};

const SIZES: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
    xl: "max-w-3xl",
};

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
    open,
    onClose,
    title,
    description,
    icon: Icon,
    children,
    footer,
    size = "md",
    dismissible = true,
    unsavedChanges = false,
    initialFocusRef,
    bodyClassName = "",
}: ModalProps) {
    const titleId = useId();
    const descriptionId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation("front/common");

    useEffect(() => {
        if (!open) return;

        const previouslyFocused = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const target = initialFocusRef?.current ?? bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
        target?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus?.();
        };
    }, [open, initialFocusRef]);

    if (!open) return null;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape" && dismissible) {
            event.stopPropagation();
            onClose();
            return;
        }
        if (event.key !== "Tab" || !panelRef.current) return;

        const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
            onKeyDown={handleKeyDown}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                className={`flex w-full ${SIZES[size]} max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-panel bg-surfaceRaisedLight dark:bg-surfaceDark shadow-2xl ring-1 ring-black/10 dark:ring-white/10 focus:outline-none`}
            >
                <header className="flex items-center gap-2 bg-primaryLight dark:bg-primaryDark px-4 py-2.5 text-onPrimaryLight dark:text-onPrimaryDark">
                    {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
                    <h2 id={titleId} className="flex-1 truncate font-libre text-base font-semibold leading-tight">
                        {title}
                    </h2>
                    {dismissible && (
                        <Button
                            variant="inverse"
                            size="sm"
                            icon={X}
                            aria-label={t("modal.close")}
                            onClick={onClose}
                            className="-mr-1"
                        />
                    )}
                </header>

                <div ref={bodyRef} className={`flex-1 overflow-y-auto px-5 py-4 text-fontPrimaryLight dark:text-fontPrimaryDark ${bodyClassName}`}>
                    {description && (
                        <p id={descriptionId} className="mb-4 text-sm text-fontPrimaryLight/75 dark:text-fontPrimaryDark/75">
                            {description}
                        </p>
                    )}
                    {children}
                </div>

                {(footer || unsavedChanges) && (
                    <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-dividerLight dark:border-dividerDark bg-surfaceLight dark:bg-paperDark px-4 py-2.5">
                        {unsavedChanges && (
                            <span
                                role="status"
                                className="mr-auto inline-flex min-w-0 items-center gap-2 text-xs font-medium text-warningTextLight dark:text-warningTextDark"
                            >
                                <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                                    <span className="absolute inset-0 rounded-full bg-warningLight dark:bg-warningDark opacity-60 animate-ping motion-reduce:animate-none" />
                                    <span className="relative h-2.5 w-2.5 rounded-full bg-warningLight dark:bg-warningDark" />
                                </span>
                                <span className="truncate">{t("modal.unsavedChanges")}</span>
                            </span>
                        )}
                        <div className="flex items-center gap-2">{footer}</div>
                    </footer>
                )}
            </div>
        </div>,
        document.body
    );
}
