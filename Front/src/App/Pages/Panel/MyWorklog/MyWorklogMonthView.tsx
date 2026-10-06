import {Plus} from 'lucide-react';
import {cn} from '@/lib/utils';
import {buildMonthGrid, formatDuration, todayIso} from '@/lib/Worklog/dateRange';
import type {MyWorklogEntry} from '@/lib/Worklog/Type/types';

type MyWorklogMonthViewProps = {
  monthAnchor: string;
  entriesByDate: Record<string, MyWorklogEntry[]>;
  onDayClick: (date: string) => void;
  onLogClick: (date: string) => void;
};

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MAX_VISIBLE_CHIPS = 2;

// No hour-of-day grid (react-big-calendar-style, unlike Day/Week's
// WorklogTimeGrid) - a month is too dense for an hour axis to be readable,
// so this stays a bucket-of-entries-per-day chip grid. This mirrors
// CalendarRangePicker's own always-6-weeks Monday-first grid convention.
const MyWorklogMonthView = ({monthAnchor, entriesByDate, onDayClick, onLogClick}: MyWorklogMonthViewProps) => {
  const cells = buildMonthGrid(monthAnchor);
  const monthPrefix = monthAnchor.slice(0, 7);
  const today = todayIso();

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date) => {
          const isOutsideMonth = !date.startsWith(monthPrefix);
          const isToday = date === today;
          const entries = entriesByDate[date] ?? [];
          const total = entries.reduce((sum, entry) => sum + entry.minutes, 0);
          const visible = entries.slice(0, MAX_VISIBLE_CHIPS);
          const hiddenCount = entries.length - visible.length;

          return (
            <div
              key={date}
              role="button"
              tabIndex={0}
              onClick={() => onDayClick(date)}
              onKeyDown={(e) => e.key === 'Enter' && onDayClick(date)}
              className={cn(
                'group relative flex min-h-20 cursor-pointer flex-col items-start gap-0.5 rounded-lg border p-1.5 text-left transition-colors hover:bg-muted',
                isOutsideMonth ? 'border-transparent text-muted-foreground/50' : 'border-border text-foreground',
                isToday && 'ring-1 ring-inset ring-accent/60',
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-medium">{Number(date.slice(8, 10))}</span>
                {total > 0 && <span className="text-[10px] text-accent">{formatDuration(total)}</span>}
              </div>

              <div className="flex w-full flex-col gap-0.5">
                {visible.map((entry) => (
                  <span key={entry.id} className="w-full truncate rounded bg-cyan-400/10 px-1 text-[10px] text-accent/90">
                    {entry.ticket.key}
                  </span>
                ))}
                {hiddenCount > 0 && <span className="text-[10px] text-muted-foreground">+{hiddenCount} more</span>}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogClick(date);
                }}
                className="absolute top-1 right-1 hidden h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-accent group-hover:flex"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyWorklogMonthView;
