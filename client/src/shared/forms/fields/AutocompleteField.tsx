import { FocusEvent, KeyboardEvent, ReactNode, Ref, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, CircleAlert, CircleCheck, Search, SearchX, X } from "lucide-react";
import Button from "../../components/Button";
import { FieldStatus } from "../useFieldStatus";
import FieldShell from "./FieldShell";
import { FieldErrorLike, controlClass, resolveStatus, useFieldIds } from "./fieldStyles";

export type AutocompleteOption = { id: number; name: string };

type CommonProps = {
  label: string;
  hideLabel?: boolean;
  options: AutocompleteOption[];
  placeholder?: string;
  error?: FieldErrorLike;
  helperText?: ReactNode;
  status?: FieldStatus;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  ref?: Ref<HTMLInputElement>;
};

type SingleProps = CommonProps & {
  multiple?: false;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
};

type MultipleProps = CommonProps & {
  multiple: true;
  value: number[] | null | undefined;
  onChange: (value: number[]) => void;
};

type AutocompleteFieldProps = SingleProps | MultipleProps;

const fold = (text: string) =>
  Array.from(text.toLowerCase(), (char) => {
    const base = char.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return base.length === 1 ? base : char;
  }).join("");

function Highlight({ text, query }: { text: string; query: string }) {
  const start = query ? fold(text).indexOf(fold(query)) : -1;
  if (start === -1) return <>{text}</>;
  const end = start + query.length;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-xs bg-highlightLight px-px text-inherit dark:bg-highlightDark">{text.slice(start, end)}</mark>
      {text.slice(end)}
    </>
  );
}

export default function AutocompleteField(props: AutocompleteFieldProps) {
  const { label, hideLabel, options, placeholder, error, helperText, status = "neutral", required, disabled, id, name, onBlur, ref } = props;
  const { t } = useTranslation();
  const ids = useFieldIds(id, Boolean(helperText), error);
  const listId = `${ids.inputId}-listbox`;
  const optionId = (optionKey: number) => `${ids.inputId}-option-${optionKey}`;
  const visualStatus = resolveStatus(error, status);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedIds = props.multiple ? (props.value ?? []) : props.value === null || props.value === undefined ? [] : [props.value];
  const selectedOptions = selectedIds.map((selectedId) => options.find((option) => option.id === selectedId)).filter((option): option is AutocompleteOption => Boolean(option));

  const needle = fold(query.trim());
  const matches = options.filter((option) => fold(option.name).includes(needle));
  const filtered = needle
    ? [...matches.filter((option) => fold(option.name).startsWith(needle)), ...matches.filter((option) => !fold(option.name).startsWith(needle))]
    : options;

  const active = open ? filtered[Math.min(activeIndex, filtered.length - 1)] : undefined;

  useEffect(() => {
    if (!active) return;
    listRef.current?.querySelector(`#${CSS.escape(optionId(active.id))}`)?.scrollIntoView({ block: "nearest" });
  });

  const openList = () => {
    if (disabled || open) return;
    setOpen(true);
    setQuery("");
    setActiveIndex(Math.max(0, options.findIndex((option) => option.id === selectedIds[0])));
  };

  const closeList = () => {
    setOpen(false);
    setQuery("");
  };

  const pick = (option: AutocompleteOption) => {
    if (props.multiple) {
      const current = props.value ?? [];
      props.onChange(current.includes(option.id) ? current.filter((item) => item !== option.id) : [...current, option.id]);
      setQuery("");
      return;
    }
    props.onChange(option.id);
    closeList();
  };

  const remove = (optionKey: number) => {
    if (props.multiple) props.onChange((props.value ?? []).filter((item) => item !== optionKey));
  };

  const clear = () => {
    if (props.multiple) props.onChange([]);
    else props.onChange(null);
    setQuery("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!open) {
          openList();
          return;
        }
        const delta = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((index) => (filtered.length === 0 ? 0 : (Math.min(index, filtered.length - 1) + delta + filtered.length) % filtered.length));
        return;
      }
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(event.key === "Home" ? 0 : filtered.length - 1);
        return;
      case "Enter":
        if (!open || !active) return;
        event.preventDefault();
        pick(active);
        return;
      case "Escape":
        if (!open) return;
        event.preventDefault();
        event.stopPropagation();
        closeList();
        return;
      case "Backspace":
        if (props.multiple && query === "" && selectedIds.length > 0) remove(selectedIds[selectedIds.length - 1]);
        return;
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    closeList();
    onBlur?.(event);
  };

  const singleName = !props.multiple ? selectedOptions[0]?.name ?? "" : "";
  const inputValue = open || props.multiple ? query : singleName;
  const inputPlaceholder = open && singleName ? singleName : placeholder;
  const hasValue = selectedIds.length > 0;

  return (
    <FieldShell label={label} hideLabel={hideLabel} required={required} helperText={helperText} error={error} {...ids}>
      <div className={`group/auto relative ${error?.message ? "animate-shake" : ""}`}>
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fontMutedLight transition-transform duration-300 ease-spring group-focus-within/auto:-rotate-12 group-focus-within/auto:scale-110 group-focus-within/auto:text-primaryLight dark:text-espresso-400 dark:group-focus-within/auto:text-primaryActiveDark"
          aria-hidden="true"
        />
        <input
          id={ids.inputId}
          ref={ref}
          name={name}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={active ? optionId(active.id) : undefined}
          aria-required={required || undefined}
          aria-invalid={error?.message ? true : undefined}
          aria-describedby={ids.describedBy}
          disabled={disabled}
          value={inputValue}
          placeholder={inputPlaceholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onClick={openList}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={controlClass(visualStatus, `truncate py-2 pl-9 ${hasValue && !disabled ? "pr-20" : "pr-14"} ${open ? "rounded-b-none" : ""}`)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
          {visualStatus === "invalid" && <CircleAlert className="pointer-events-none h-5 w-5 text-errorLight dark:text-errorSolidDark" aria-hidden="true" />}
          {visualStatus === "valid" && <CircleCheck className="pointer-events-none h-5 w-5 animate-pop text-successLight dark:text-successSolidLight" aria-hidden="true" />}
          {hasValue && !disabled && (
            <Button
              variant="ghost"
              icon={X}
              aria-label={t("fields.clear")}
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
              className="h-10 w-10 text-fontMutedLight hover:rotate-90 hover:text-errorLight dark:text-espresso-500 dark:hover:text-errorSolidDark"
            />
          )}
          <ChevronDown
            className={`pointer-events-none h-5 w-5 text-secondaryActiveLight transition-transform duration-300 ease-spring dark:text-primaryActiveDark ${open ? "rotate-180 text-primaryLight dark:text-primaryDark" : ""} ${hasValue && !disabled ? "" : "ml-2"}`}
            aria-hidden="true"
          />
        </div>

        {open && (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label={label}
            aria-multiselectable={props.multiple || undefined}
            onMouseDown={(event) => event.preventDefault()}
            className="absolute inset-x-0 top-full z-30 max-h-60 origin-top overflow-y-auto overscroll-contain rounded-b-panel border border-t-0 border-panelBorderLight bg-panelLight py-1 text-sm font-libre text-fontPrimaryLight shadow-soft-lg animate-scale-in dark:border-panelBorderDark dark:bg-panelDark dark:text-fontPrimaryDark dark:shadow-deep-lg"
          >
            {filtered.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              const isActive = active?.id === option.id;
              return (
                <li
                  key={option.id}
                  id={optionId(option.id)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => pick(option)}
                  onMouseMove={() => !isActive && setActiveIndex(filtered.indexOf(option))}
                  className={`flex min-h-10 cursor-pointer items-center gap-2 px-3 py-2 transition-colors duration-150 ${isActive ? "bg-panelHoverLight dark:bg-panelHoverDark" : ""} ${isSelected ? "font-semibold text-primaryLight dark:text-primaryDark" : ""}`}
                >
                  <span className="min-w-0 flex-1 truncate">
                    <Highlight text={option.name} query={query.trim()} />
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 animate-pop" strokeWidth={3} aria-hidden="true" />}
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li role="presentation" className="flex min-h-10 items-center gap-2 px-4 py-2 italic text-fontMutedLight dark:text-fontMutedDark">
                <SearchX className="h-4 w-4 shrink-0 animate-wiggle" aria-hidden="true" />
                {t("fields.noResults")}
              </li>
            )}
          </ul>
        )}
      </div>

      {props.multiple && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              size="sm"
              rightIcon={X}
              iconClassName="opacity-70"
              aria-label={t("fields.remove", { label: option.name })}
              disabled={disabled}
              onClick={() => remove(option.id)}
              className="min-h-10 max-w-full animate-scale-in bg-primaryLight/5 text-xs dark:bg-primaryDark/10 [&>span]:truncate"
            >
              {option.name}
            </Button>
          ))}
        </div>
      )}
    </FieldShell>
  );
}
