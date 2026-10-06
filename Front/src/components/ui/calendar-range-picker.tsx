import {useState} from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";

export type CalendarOccupiedRange = {
  startDate: string;
  endDate: string;
  label: string;
};

export type CalendarRangePickerProps = {
  startDate: string;
  endDate: string;
  onChange: (dates: {startDate: string; endDate: string}) => void;
  // Other bookings to show as busy on the grid - e.g. a board's other
  // sprints, so picking a new sprint's dates doesn't require cross-checking
  // a separate list by hand.
  occupied?: CalendarOccupiedRange[];
  className?: string;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

const toIso = (year: number, month: number, day: number): string => `${year}-${pad2(month + 1)}-${pad2(day)}`;

const todayIso = (): string => {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
};

// ISO yyyy-mm-dd strings compare correctly with plain string comparison, no
// Date parsing needed for range containment checks.
const isWithin = (iso: string, start: string, end: string): boolean => iso >= start && iso <= end;

// Always exactly 6 weeks (42 cells), Monday-first - a fixed grid height so
// the picker doesn't reflow/jump when navigating between months with a
// different number of visible weeks.
const buildMonthGrid = (year: number, month: number): string[] => {
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // 0 = Monday
  const cells: string[] = [];

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(Date.UTC(year, month, 1 - firstWeekday + i));
    cells.push(toIso(cellDate.getUTCFullYear(), cellDate.getUTCMonth(), cellDate.getUTCDate()));
  }

  return cells;
};

// A month-grid calendar (not a native <input type="date"> popup, which can't
// be customized) that shades `occupied` ranges directly on the days, so
// picking a new range's free slot doesn't require cross-referencing a
// separate list. Click a day to start a range, click another to close it -
// clicking before the current start restarts the range from there instead.
const CalendarRangePicker = ({startDate, endDate, onChange, occupied = [], className}: CalendarRangePickerProps) => {
  const initial = startDate || todayIso();
  const [year, month] = initial.split("-").map(Number).slice(0, 2) as [number, number];
  const [viewYear, setViewYear] = useState(year);
  const [viewMonth, setViewMonth] = useState(month - 1);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (iso: string) => {
    if (!startDate || (startDate && endDate)) {
      onChange({startDate: iso, endDate: ""});
      return;
    }

    if (iso < startDate) {
      onChange({startDate: iso, endDate: ""});
      return;
    }

    onChange({startDate, endDate: iso});
  };

  const cells = buildMonthGrid(viewYear, viewMonth);
  const monthLabel = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const today = todayIso();
  const monthPrefix = `${viewYear}-${pad2(viewMonth + 1)}`;

  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border border-white/10 bg-white/3 p-3", className)}>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disableRipple
          onClick={goToPrevMonth}
          aria-label="Previous month"
          className="h-6 w-6 min-w-0 rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <p className="text-sm font-medium text-zinc-200">{monthLabel}</p>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disableRipple
          onClick={goToNextMonth}
          aria-label="Next month"
          className="h-6 w-6 min-w-0 rounded-md text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-zinc-500">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso) => {
          const isOutsideMonth = !iso.startsWith(monthPrefix);
          const isToday = iso === today;
          const isRangeStart = iso === startDate;
          const isRangeEnd = iso === endDate;
          const isInSelectedRange = Boolean(startDate && endDate) && isWithin(iso, startDate, endDate);
          const occupiedBy = occupied.find((range) => isWithin(iso, range.startDate, range.endDate));

          return (
            <button
              key={iso}
              type="button"
              onClick={() => handleDayClick(iso)}
              title={occupiedBy ? occupiedBy.label : undefined}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors",
                isOutsideMonth ? "text-zinc-600" : "text-zinc-300",
                "hover:bg-white/10",
                isInSelectedRange && !isRangeStart && !isRangeEnd && "bg-cyan-400/20 text-cyan-100",
                (isRangeStart || isRangeEnd) && "bg-cyan-400 font-semibold text-black hover:bg-cyan-400",
                isToday && !isRangeStart && !isRangeEnd && "ring-1 ring-inset ring-white/30",
              )}
            >
              {Number(iso.slice(8, 10))}

              {occupiedBy && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-0.5 h-1 w-1 rounded-full",
                    isRangeStart || isRangeEnd ? "bg-black/60" : "bg-amber-400",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 pt-2 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Selected
        </span>
      </div>
    </div>
  );
};

export {CalendarRangePicker};
