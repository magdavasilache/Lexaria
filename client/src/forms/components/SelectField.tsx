import { FocusEvent, KeyboardEvent, ReactNode, Ref, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { FieldStatus } from "../useFieldStatus";
import FieldShell, { StatusIcon } from "./FieldShell";
import { FieldErrorLike, controlClass, panelControlClass, resolveStatus, useFieldIds } from "./fieldStyles";

export type SelectOption<T extends string | number = string | number> = { value: T; label: string; disabled?: boolean };

type SelectFieldProps<T extends string | number> = {
    label: string;
    hideLabel?: boolean;
    options: SelectOption<T>[];
    value: T | null | undefined;
    onChange: (value: T) => void;
    placeholder?: string;
    error?: FieldErrorLike;
    helperText?: ReactNode;
    status?: FieldStatus;
    tone?: "input" | "panel";
    required?: boolean;
    disabled?: boolean;
    id?: string;
    className?: string;
    onBlur?: (event: FocusEvent<HTMLDivElement>) => void;
    ref?: Ref<HTMLDivElement>;
};

const TYPEAHEAD_RESET_MS = 500;
const LIST_MAX_HEIGHT = 240;
const OPTION_HEIGHT = 40;
const LIST_PADDING = 8;

export default function SelectField<T extends string | number>({ label, hideLabel, options, value, onChange, placeholder, error, helperText, status = "neutral", tone = "input", required, disabled, id, className, onBlur, ref }: SelectFieldProps<T>) {
    const ids = useFieldIds(id, Boolean(helperText), error);
    const listId = `${ids.inputId}-listbox`;
    const optionId = (index: number) => `${ids.inputId}-option-${index}`;
    const visualStatus = resolveStatus(error, status);
    const surfaceClass = (extra: string) =>
        tone === "panel" && visualStatus === "neutral" ? panelControlClass(extra) : controlClass(visualStatus, extra);
    const listRef = useRef<HTMLUListElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [dropUp, setDropUp] = useState(false);
    const typeahead = useRef({ buffer: "", timer: 0 });
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const selectedIndex = options.findIndex((option) => option.value === value);
    const selected = selectedIndex === -1 ? undefined : options[selectedIndex];
    const enabledIndexes = options.flatMap((option, index) => (option.disabled ? [] : [index]));

    useEffect(() => {
        if (!open) return;
        listRef.current?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)?.scrollIntoView({ block: "nearest" });
    });

    useEffect(() => () => window.clearTimeout(typeahead.current.timer), []);

    const openList = (index = selectedIndex) => {
        if (disabled || enabledIndexes.length === 0) return;
        setActiveIndex(enabledIndexes.includes(index) ? index : enabledIndexes[0]);
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (rect) {
            const listHeight = Math.min(LIST_MAX_HEIGHT, options.length * OPTION_HEIGHT + LIST_PADDING);
            const spaceBelow = window.innerHeight - rect.bottom;
            setDropUp(spaceBelow < listHeight && rect.top > spaceBelow);
        }
        setOpen(true);
    };

    const pick = (index: number) => {
        const option = options[index];
        if (!option || option.disabled) return;
        if (option.value !== value) onChange(option.value);
        setOpen(false);
    };

    const step = (delta: 1 | -1) => {
        const position = enabledIndexes.indexOf(activeIndex);
        const next = (position + delta + enabledIndexes.length) % enabledIndexes.length;
        setActiveIndex(enabledIndexes[next]);
    };

    const jumpTo = (char: string) => {
        window.clearTimeout(typeahead.current.timer);
        typeahead.current.buffer += char.toLowerCase();
        typeahead.current.timer = window.setTimeout(() => (typeahead.current.buffer = ""), TYPEAHEAD_RESET_MS);
        const match = enabledIndexes.find((index) => options[index].label.toLowerCase().startsWith(typeahead.current.buffer));
        if (match === undefined) return;
        if (open) setActiveIndex(match);
        else openList(match);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case "ArrowDown":
            case "ArrowUp":
                event.preventDefault();
                if (!open) openList();
                else step(event.key === "ArrowDown" ? 1 : -1);
                return;
            case "Home":
            case "End":
                if (!open) return;
                event.preventDefault();
                setActiveIndex(event.key === "Home" ? enabledIndexes[0] : enabledIndexes[enabledIndexes.length - 1]);
                return;
            case "Enter":
            case " ":
                event.preventDefault();
                if (open) pick(activeIndex);
                else openList();
                return;
            case "Escape":
                if (!open) return;
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                return;
            case "Tab":
                if (open) setOpen(false);
                return;
            default:
                if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) jumpTo(event.key);
        }
    };

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
        setOpen(false);
        onBlur?.(event);
    };

    return (
        <FieldShell label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={error} onLabelClick={() => document.getElementById(ids.inputId)?.focus()} {...ids}>
            <div ref={wrapperRef} className={`group/select relative ${error?.message ? "animate-shake" : ""}`}>
                <div
                    id={ids.inputId}
                    ref={ref}
                    role="combobox"
                    tabIndex={disabled ? -1 : 0}
                    aria-label={label}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-activedescendant={open ? optionId(activeIndex) : undefined}
                    aria-required={required || undefined}
                    aria-invalid={error?.message ? true : undefined}
                    aria-disabled={disabled || undefined}
                    aria-describedby={ids.describedBy}
                    onClick={() => (open ? setOpen(false) : openList())}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    className={surfaceClass(
                        `flex select-none items-center py-2 pl-3 ${visualStatus === "neutral" ? "pr-10" : "pr-16"} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${open ? (dropUp ? "rounded-t-none" : "rounded-b-none") : ""} ${className ?? ""}`
                    )}
                >
                    <span className={`min-w-0 flex-1 truncate ${selected ? "" : "text-fontMutedLight dark:text-espresso-400"}`}>{selected?.label ?? placeholder ?? " "}</span>
                </div>
                <StatusIcon status={visualStatus} className="right-9 top-1/2 -translate-y-1/2" />
                <ChevronDown
                    className={`pointer-events-none absolute right-2.5 top-1/2 h-5 w-5 -translate-y-1/2 text-secondaryActiveLight transition-transform duration-300 ease-spring dark:text-primaryActiveDark ${open ? "rotate-180 text-primaryLight dark:text-primaryDark" : "group-hover/select:translate-y-[-40%]"}`}
                    aria-hidden="true"
                />

                {open && (
                    <ul
                        id={listId}
                        ref={listRef}
                        role="listbox"
                        aria-label={label}
                        onMouseDown={(event) => event.preventDefault()}
                        className={`absolute inset-x-0 z-30 max-h-60 overflow-y-auto overscroll-contain border border-panelBorderLight ${dropUp ? "bottom-full origin-bottom rounded-t-panel border-b-0" : "top-full origin-top rounded-b-panel border-t-0"} bg-panelLight py-1 text-sm font-libre text-fontPrimaryLight shadow-soft-lg animate-scale-in dark:border-panelBorderDark dark:bg-panelDark dark:text-fontPrimaryDark dark:shadow-deep-lg`}
                    >
                        {options.map((option, index) => {
                            const isSelected = index === selectedIndex;
                            const isActive = index === activeIndex;
                            return (
                                <li
                                    key={option.value}
                                    id={optionId(index)}
                                    role="option"
                                    aria-selected={isSelected}
                                    aria-disabled={option.disabled || undefined}
                                    onClick={() => pick(index)}
                                    onMouseMove={() => !isActive && !option.disabled && setActiveIndex(index)}
                                    className={`flex min-h-10 items-center gap-2 px-3 py-2 transition-colors duration-150 ${option.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${isActive ? "bg-panelHoverLight dark:bg-panelHoverDark" : ""} ${isSelected ? "font-semibold text-primaryLight dark:text-primaryDark" : ""}`}
                                >
                                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                                    {isSelected && <Check className="h-4 w-4 shrink-0 animate-pop" strokeWidth={3} aria-hidden="true" />}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </FieldShell>
    );
}
