import { KeyboardEvent, RefObject, useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DialogBehavior = {
  open: boolean;
  panelRef: RefObject<HTMLElement | null>;
  initialFocus?: () => HTMLElement | null | undefined;
  onEscape?: () => void;
};

export const firstFocusable = (container: HTMLElement | null | undefined) => container?.querySelector<HTMLElement>(FOCUSABLE);

export const useDialogBehavior = ({ open, panelRef, initialFocus, onEscape }: DialogBehavior) => {
  const initialFocusRef = useRef(initialFocus);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    initialFocusRef.current = initialFocus;
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (initialFocusRef.current?.() ?? panelRef.current)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, panelRef]);

  return (event: KeyboardEvent<HTMLElement>) => {
    const panel = panelRef.current;
    if (!panel || !panel.contains(event.target as Node)) return;

    if (event.key === "Escape") {
      if (onEscapeRef.current) {
        event.stopPropagation();
        onEscapeRef.current();
      }
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
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
};
