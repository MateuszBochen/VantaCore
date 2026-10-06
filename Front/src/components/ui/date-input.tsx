import {useRef, useState} from "react";
import {Calendar, Clock, X} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";

export type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  type?: "date" | "time" | "datetime-local";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

// Native date/time/datetime-local inputs render their own "empty" hint and
// separators however the browser/OS locale dictates - there is no reliable
// cross-browser CSS way to force a specific separator (rrrr.mm.dd) or match
// our own placeholder color on them. This formats the native value for
// display; a hidden native input (below) still holds the real value and
// drives the native picker via showPicker().
const formatValue = (value: string, type: NonNullable<DateInputProps["type"]>): string => {
  if (!value) {
    return "";
  }

  if (type === "time") {
    return value;
  }

  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-");
  const formattedDate = `${year}.${month}.${day}`;

  return type === "date" ? formattedDate : `${formattedDate} ${timePart ?? ""}`.trim();
};

const parseTimePart = (text: string): {hours: number; minutes: number} | null => {
  const match = text.trim().match(/^(\d{1,2})[:.,](\d{2})(?:[:.,]\d{2})?\s*(am|pm)?$/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();

  if (minutes > 59) {
    return null;
  }

  if (meridiem === "pm" && hours < 12) {
    hours += 12;
  } else if (meridiem === "am" && hours === 12) {
    hours = 0;
  }

  return hours > 23 ? null : {hours, minutes};
};

const parseDatePart = (text: string): {year: number; month: number; day: number} | null => {
  const trimmed = text.trim();

  // yyyy-mm-dd / yyyy.mm.dd / yyyy/mm/dd - unambiguous, year first.
  let match = trimmed.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (match) {
    return {year: Number(match[1]), month: Number(match[2]), day: Number(match[3])};
  }

  // dd.mm.yyyy / dd-mm-yyyy / dd/mm/yyyy - day first, the Polish/European
  // convention assumed for this ambiguous case (vs. US mm/dd/yyyy).
  match = trimmed.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (match) {
    return {day: Number(match[1]), month: Number(match[2]), year: Number(match[3])};
  }

  return null;
};

const isValidDate = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

// Best-effort: a date/time copied from somewhere else is rarely in our exact
// display format. Tries explicit yyyy-first and day-first patterns (covering
// the formats people actually paste), then falls back to the runtime's own
// Date parser for anything else (month names, ISO with offsets, ...).
// Returns the native <input> value format, or null if nothing could be made of it.
const parseFlexibleDateTime = (text: string, type: NonNullable<DateInputProps["type"]>): string | null => {
  const trimmed = text.trim();

  if (!trimmed) {
    return null;
  }

  if (type === "time") {
    const time = parseTimePart(trimmed);
    return time ? `${pad2(time.hours)}:${pad2(time.minutes)}` : null;
  }

  const [datePortion, ...timePortion] = trimmed.split(/[T\s]+/);
  const datePart = parseDatePart(datePortion);

  if (datePart && isValidDate(datePart.year, datePart.month, datePart.day)) {
    const isoDate = `${datePart.year}-${pad2(datePart.month)}-${pad2(datePart.day)}`;

    if (type === "date") {
      return isoDate;
    }

    const time = timePortion.length > 0 ? parseTimePart(timePortion.join(" ")) : null;
    return `${isoDate}T${time ? `${pad2(time.hours)}:${pad2(time.minutes)}` : "00:00"}`;
  }

  const fallback = new Date(trimmed);

  if (Number.isNaN(fallback.getTime())) {
    return null;
  }

  const isoDate = `${fallback.getFullYear()}-${pad2(fallback.getMonth() + 1)}-${pad2(fallback.getDate())}`;

  return type === "date" ? isoDate : `${isoDate}T${pad2(fallback.getHours())}:${pad2(fallback.getMinutes())}`;
};

function DateInput({value, onChange, type = "date", placeholder, disabled, className}: DateInputProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => formatValue(value, type));
  const [focused, setFocused] = useState(false);
  const Icon = type === "time" ? Clock : Calendar;
  const clearable = !disabled && value !== "";

  // Reflect picker-driven or external `value`/`type` changes into the text
  // field - but not while the user is actively typing/pasting into it, or
  // their in-progress edit would get clobbered mid-keystroke. Render-phase
  // (converges on the sentinel) rather than an effect - a stale display for
  // a paint frame after an external change would be a visible flicker.
  const [syncedFrom, setSyncedFrom] = useState({value, type});
  if (!focused && (syncedFrom.value !== value || syncedFrom.type !== type)) {
    setSyncedFrom({value, type});
    setDraft(formatValue(value, type));
  }

  const commitDraft = (raw: string) => {
    const trimmed = raw.trim();

    if (trimmed === "") {
      onChange("");
      return;
    }

    const parsed = parseFlexibleDateTime(trimmed, type);

    if (parsed) {
      onChange(parsed);
      setDraft(formatValue(parsed, type));
      return;
    }

    // Couldn't make sense of it - revert rather than keep an invalid value.
    setDraft(formatValue(value, type));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    const parsed = parseFlexibleDateTime(text, type);

    if (parsed) {
      e.preventDefault();
      onChange(parsed);
      setDraft(formatValue(parsed, type));
    }
    // Otherwise let the default paste land in the field as typed text - blur
    // will try to parse it too and revert if it's still not recognizable.
  };

  const openPicker = () => {
    if (disabled) {
      return;
    }

    const input = hiddenInputRef.current;

    if (input && "showPicker" in input) {
      try {
        (input as HTMLInputElement & {showPicker: () => void}).showPicker();
        return;
      } catch {
        // Not all browsers support showPicker() (or require a direct user
        // gesture) - fall back to focusing the (invisible) native input so
        // the field is at least still usable via keyboard.
      }
    }

    input?.focus();
  };

  return (
    <div
      className={cn(
        // --input-background/--input-border, same reasoning as Input/Select/Checkbox/Textarea/Combobox.
        "relative flex h-8 w-full min-w-0 items-center gap-1.5 rounded-lg border border-(--input-border) bg-(--input-background) px-2.5 py-1 text-base text-foreground transition-colors",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "pointer-events-none cursor-not-allowed opacity-50",
        "md:text-sm",
        className,
      )}
    >
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onPaste={handlePaste}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          commitDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />

      {clearable && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disableRipple
          onClick={() => {
            onChange("");
            setDraft("");
          }}
          className="h-5 w-5 min-w-0 shrink-0 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disableRipple
        disabled={disabled}
        onClick={openPicker}
        className="h-5 w-5 min-w-0 shrink-0 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Icon className="h-4 w-4 opacity-70" />
      </Button>

      {/* Spans the whole field (still invisible and unclickable) rather than
          being 0x0 - showPicker() anchors the native calendar to THIS
          element's box, and with no size Chrome can lose track of where it
          is and open the calendar in the page's top-left corner. */}
      <input
        ref={hiddenInputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  );
}

export {DateInput};