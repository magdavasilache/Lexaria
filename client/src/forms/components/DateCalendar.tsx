import { CSSProperties, KeyboardEvent, RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../../global-components/buttons/Button";

type View = "days" | "months" | "years";

type DateCalendarProps = {
  value: string;
  min?: string;
  max?: string;
  clearable: boolean;
  autoFocus: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  onSelect: (value: string) => void;
  onClose: () => void;
};

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const YEARS_PER_PAGE = 12;
const GAP = 4;
const EDGE = 8;
const MIN_HEIGHT = 160;
const FOCUSABLE = "button:not([disabled]):not([tabindex='-1']), [tabindex='0']";

const pad = (value: number) => String(value).padStart(2, "0");
const toIso = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
const fromDate = (date: Date) => toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
const parts = (iso: string) => ({ year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) - 1, day: Number(iso.slice(8, 10)) });
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const isIsoDate = (value: string) => ISO_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const localToday = () => {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
};

const addDays = (iso: string, amount: number) => {
  const { year, month, day } = parts(iso);
  return fromDate(new Date(Date.UTC(year, month, day + amount)));
};

const addMonths = (iso: string, amount: number) => {
  const { year, month, day } = parts(iso);
  const target = new Date(Date.UTC(year, month + amount, 1));
  const targetYear = target.getUTCFullYear();
  const targetMonth = target.getUTCMonth();
  return toIso(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)));
};

const clamp = (iso: string, min?: string, max?: string) => (min && iso < min ? min : max && iso > max ? max : iso);

export default function DateCalendar({ value, min, max, clearable, autoFocus, anchorRef, panelRef, onSelect, onClose }: DateCalendarProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? "en";
  const weekStart = language === "en" ? 0 : 1;
  const today = localToday();
  const selected = isIsoDate(value) ? value : "";
  const [cursor, setCursor] = useState(() => clamp(selected || today, min, max));
  const [view, setView] = useState<View>("days");
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(autoFocus);
  const [openUp, setOpenUp] = useState(false);
  const [position, setPosition] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const rect = anchor.getBoundingClientRect();
      const { innerWidth, innerHeight } = window;
      const naturalHeight = panel.scrollHeight + panel.offsetHeight - panel.clientHeight;
      const spaceBelow = Math.max(0, innerHeight - rect.bottom - GAP - EDGE);
      const spaceAbove = Math.max(0, rect.top - GAP - EDGE);
      const up = naturalHeight > spaceBelow && spaceAbove > spaceBelow;
      setOpenUp(up);
      const left = Math.max(EDGE, Math.min(rect.left, innerWidth - panel.offsetWidth - EDGE));
      const maxHeight = Math.max(MIN_HEIGHT, up ? spaceAbove : spaceBelow);
      setPosition(
        up
          ? { left, maxHeight, bottom: Math.min(innerHeight - EDGE - maxHeight, Math.max(EDGE, innerHeight - rect.top + GAP)) }
          : { left, maxHeight, top: Math.min(innerHeight - EDGE - maxHeight, Math.max(EDGE, rect.bottom + GAP)) }
      );
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place);
    };
  }, [anchorRef, panelRef, view]);

  useEffect(() => {
    if (selected) setCursor(selected);
  }, [selected]);

  useEffect(() => {
    if (!shouldFocus.current || view !== "days") return;
    gridRef.current?.querySelector<HTMLElement>(`[data-date="${cursor}"]`)?.focus();
  }, [cursor, view]);

  const { year, month } = parts(cursor);
  const outOfRange = (iso: string) => Boolean((min && iso < min) || (max && iso > max));
  const format = (options: Intl.DateTimeFormatOptions, iso: string) =>
    new Intl.DateTimeFormat(language, { timeZone: "UTC", ...options }).format(new Date(`${iso}T00:00:00Z`));

  const firstOfMonth = toIso(year, month, 1);
  const leading = (new Date(`${firstOfMonth}T00:00:00Z`).getUTCDay() - weekStart + 7) % 7;
  const gridStart = addDays(firstOfMonth, -leading);
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const weekdays = days.slice(0, 7).map((iso) => ({ iso, short: format({ weekday: "short" }, iso), long: format({ weekday: "long" }, iso) }));
  const pageStart = year - (((year % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);

  const move = (next: string) => {
    shouldFocus.current = true;
    setCursor(clamp(next, min, max));
  };

  const shift = (direction: 1 | -1) => {
    shouldFocus.current = false;
    if (view === "days") setCursor(addMonths(cursor, direction));
    else if (view === "months") setCursor(addMonths(cursor, 12 * direction));
    else setCursor(addMonths(cursor, 12 * YEARS_PER_PAGE * direction));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === "Tab") {
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      const index = focusable.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      event.stopPropagation();
      if (focusable.length === 0) return;
      const next = index === -1 ? 0 : (index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      focusable[next].focus();
      return;
    }
    if (view !== "days") return;
    const dayOfWeek = (new Date(`${cursor}T00:00:00Z`).getUTCDay() - weekStart + 7) % 7;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(cursor, -1),
      ArrowRight: () => addDays(cursor, 1),
      ArrowUp: () => addDays(cursor, -7),
      ArrowDown: () => addDays(cursor, 7),
      Home: () => addDays(cursor, -dayOfWeek),
      End: () => addDays(cursor, 6 - dayOfWeek),
      PageUp: () => addMonths(cursor, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(cursor, event.shiftKey ? 12 : 1),
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    move(next());
  };

  const caption =
    view === "days"
      ? format({ month: "long", year: "numeric" }, firstOfMonth)
      : view === "months"
        ? String(year)
        : `${pageStart} – ${pageStart + YEARS_PER_PAGE - 1}`;

  const navLabels = {
    days: [t("fields.calendar.previousMonth"), t("fields.calendar.nextMonth")],
    months: [t("fields.calendar.previousYear"), t("fields.calendar.nextYear")],
    years: [t("fields.calendar.previousYears"), t("fields.calendar.nextYears")],
  }[view];

  const monthDisabled = (monthIndex: number) =>
    Boolean((min && toIso(year, monthIndex, daysInMonth(year, monthIndex)) < min) || (max && toIso(year, monthIndex, 1) > max));
  const yearDisabled = (candidate: number) => Boolean((min && `${candidate}-12-31` < min) || (max && `${candidate}-01-01` > max));

  const portalTarget = anchorRef.current?.closest("[aria-modal='true']")?.parentElement ?? document.body;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t("fields.calendar.label")}
      onMouseDown={(event) => event.preventDefault()}
      onKeyDown={handleKeyDown}
      style={position ?? { left: 0, top: 0 }}
      className={`fixed z-[90] w-[18.5rem] max-w-[calc(100vw-1.5rem)] overflow-y-auto overscroll-contain rounded-panel border border-panelBorderLight bg-panelLight p-2 font-libre text-fontPrimaryLight shadow-soft-lg animate-scale-in dark:border-panelBorderDark dark:bg-panelDark dark:text-fontPrimaryDark dark:shadow-deep-lg sm:p-3 ${position ? "" : "invisible"} ${openUp ? "origin-bottom" : "origin-top"}`}
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <Button variant="ghost" size="sm" icon={ChevronLeft} aria-label={navLabels[0]} onClick={() => shift(-1)} className="h-10 w-10" />
        <Button
          variant="ghost"
          size="sm"
          rightIcon={view === "years" ? undefined : ChevronDown}
          aria-live="polite"
          disabled={view === "years"}
          aria-label={view === "years" ? caption : t(view === "days" ? "fields.calendar.chooseMonth" : "fields.calendar.chooseYear", { value: caption })}
          onClick={() => setView(view === "days" ? "months" : "years")}
          className="min-h-10 font-semibold capitalize disabled:opacity-100"
        >
          {caption}
        </Button>
        <Button variant="ghost" size="sm" icon={ChevronRight} aria-label={navLabels[1]} onClick={() => shift(1)} className="h-10 w-10" />
      </div>

      {view === "days" && (
        <div ref={gridRef} role="grid" aria-label={caption}>
          <div role="row" className="mb-1 grid grid-cols-7">
            {weekdays.map((weekday) => (
              <abbr
                key={weekday.iso}
                role="columnheader"
                title={weekday.long}
                className="py-1 text-center text-xs uppercase tracking-wide text-fontMutedLight no-underline dark:text-fontMutedDark"
              >
                {weekday.short.replace(".", "").slice(0, 2)}
              </abbr>
            ))}
          </div>
          <div role="rowgroup" className="grid grid-cols-7 gap-0.5">
            {days.map((iso) => {
              const inMonth = parts(iso).month === month;
              return (
                <div key={iso} role="gridcell" aria-selected={iso === selected}>
                  <Button
                    variant="calendar"
                    size="sm"
                    data-date={iso}
                    tabIndex={iso === cursor ? 0 : -1}
                    disabled={outOfRange(iso)}
                    aria-pressed={iso === selected}
                    aria-current={iso === today ? "date" : undefined}
                    aria-label={format({ dateStyle: "full" }, iso)}
                    onClick={() => onSelect(iso)}
                    className={`h-9 w-full sm:h-10 ${inMonth ? "" : "opacity-50"}`}
                  >
                    {parts(iso).day}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "months" && (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, monthIndex) => (
            <Button
              key={monthIndex}
              variant="calendar"
              size="sm"
              disabled={monthDisabled(monthIndex)}
              aria-pressed={Boolean(selected) && parts(selected).year === year && parts(selected).month === monthIndex}
              aria-current={parts(today).year === year && parts(today).month === monthIndex ? "date" : undefined}
              onClick={() => {
                setCursor(clamp(toIso(year, monthIndex, Math.min(parts(cursor).day, daysInMonth(year, monthIndex))), min, max));
                setView("days");
              }}
              className="h-10 w-full capitalize"
            >
              {format({ month: "short" }, toIso(year, monthIndex, 1)).replace(".", "")}
            </Button>
          ))}
        </div>
      )}

      {view === "years" && (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: YEARS_PER_PAGE }, (_, index) => pageStart + index).map((candidate) => (
            <Button
              key={candidate}
              variant="calendar"
              size="sm"
              disabled={yearDisabled(candidate)}
              aria-pressed={Boolean(selected) && parts(selected).year === candidate}
              aria-current={parts(today).year === candidate ? "date" : undefined}
              onClick={() => {
                setCursor(addMonths(cursor, (candidate - year) * 12));
                setView("months");
              }}
              className="h-10 w-full"
            >
              {candidate}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-panelBorderLight pt-2 dark:border-panelBorderDark">
        <Button variant="link" size="sm" disabled={outOfRange(today)} onClick={() => onSelect(today)} className="min-h-10">
          {t("fields.calendar.today")}
        </Button>
        {clearable && selected && (
          <Button variant="link" size="sm" onClick={() => onSelect("")} className="min-h-10 text-fontMutedLight dark:text-fontMutedDark">
            {t("fields.calendar.clear")}
          </Button>
        )}
      </div>
    </div>,
    portalTarget
  );
}
