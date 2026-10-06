const pad2 = (n: number): string => String(n).padStart(2, '0');

// month is 0-indexed - same convention as CalendarRangePicker.
export const toIso = (year: number, month: number, day: number): string => `${year}-${pad2(month + 1)}-${pad2(day)}`;

export const todayIso = (): string => {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
};

// UTC-anchored so day-math (addDays/startOfWeek/shiftMonth) never drifts
// across DST transitions - same precedent as CalendarRangePicker.
const parseIso = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const addDays = (iso: string, delta: number): string => {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + delta);
  return toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

// Monday of the ISO week containing `iso`.
export const startOfWeek = (iso: string): string => {
  const weekday = (parseIso(iso).getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(iso, -weekday);
};

export const startOfMonth = (iso: string): string => {
  const [year, month] = iso.split('-');
  return `${year}-${month}-01`;
};

export const endOfMonth = (iso: string): string => {
  const [year, month] = iso.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return toIso(year, month - 1, lastDay);
};

// Same day-of-month next/previous month, clamped when the target month is
// shorter (e.g. Jan 31 -> Feb 28).
export const shiftMonth = (iso: string, delta: number): string => {
  const [year, month, day] = iso.split('-').map(Number);
  const targetMonthIndex0 = month - 1 + delta;
  const daysInTarget = new Date(Date.UTC(year, targetMonthIndex0 + 1, 0)).getUTCDate();
  const date = new Date(Date.UTC(year, targetMonthIndex0, Math.min(day, daysInTarget)));
  return toIso(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

// Always exactly 6 weeks (42 cells), Monday-first - same fixed-height grid
// convention as CalendarRangePicker's buildMonthGrid, so the month view
// doesn't reflow between 4/5/6-week months.
export const buildMonthGrid = (monthAnchorIso: string): string[] => {
  const [year, month] = monthAnchorIso.split('-').map(Number);
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: string[] = [];

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(Date.UTC(year, month - 1, 1 - firstWeekday + i));
    cells.push(toIso(cellDate.getUTCFullYear(), cellDate.getUTCMonth(), cellDate.getUTCDate()));
  }

  return cells;
};

export const formatDayLabel = (iso: string): string =>
  parseIso(iso).toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC'});

export const formatWeekdayLabel = (iso: string): string =>
  parseIso(iso).toLocaleDateString('en-US', {weekday: 'short', timeZone: 'UTC'});

export const formatMonthLabel = (iso: string): string =>
  parseIso(iso).toLocaleDateString('en-US', {month: 'long', year: 'numeric', timeZone: 'UTC'});

export const formatDuration = (minutes: number): string => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const pad2Local = (n: number): string => String(n).padStart(2, '0');

// Everywhere outside a <DateInput type="datetime-local">'s own value, a
// "dateTime" is a bare (zoneless) local datetime string - "yyyy-MM-
// ddTHH:mm:ss", no "Z"/offset suffix. This matches the backend's Java
// `LocalDateTime` wire format exactly (confirmed against
// WorklogRequest/WorklogResult/MyWorklogResult in the Api project: the JSON
// field is still called `date`, just widened from a bare date to a full
// LocalDateTime): NOT an ISO *instant* like useStartWorklogHook's
// `startedAt` - deliberately never call `.toISOString()` on a value headed
// for the worklog date field, since that both renames the local wall-clock
// time to UTC (wrong instant once the browser isn't in UTC+0) AND appends a
// "Z" suffix that `LocalDateTime.parse` on the backend rejects outright.
// Reading a value back FROM the backend is safe to do via plain
// `new Date(iso)`, though - the ECMAScript spec treats a zone-less
// date-time string as local time, so the getHours()/getMinutes()/etc.
// getters below already line up with the backend's own local wall-clock
// value with no conversion needed.
export const toLocalDateTimeString = (date: Date): string =>
  `${toIso(date.getFullYear(), date.getMonth(), date.getDate())}T${pad2Local(date.getHours())}:${pad2Local(date.getMinutes())}:${pad2Local(date.getSeconds())}`;

// Local calendar day of a worklog dateTime - the correct key for grouping
// MyWorklogEntry/WorklogEntry into entriesByDate (entry.date used to just
// BE this key; now it has to be derived).
export const localDateOf = (iso: string): string => {
  const date = new Date(iso);
  return toIso(date.getFullYear(), date.getMonth(), date.getDate());
};

export const minutesSinceMidnightLocal = (iso: string): number => {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
};

export const combineLocalDateAndMinutes = (date: string, minutesSinceMidnight: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  return toLocalDateTimeString(new Date(year, month - 1, day, 0, minutesSinceMidnight));
};

// "YYYY-MM-DDTHH:mm" in local time, the exact value a
// <DateInput type="datetime-local"> reads/writes.
export const toDateTimeLocalValue = (iso: string): string => {
  const date = new Date(iso);
  return `${toIso(date.getFullYear(), date.getMonth(), date.getDate())}T${pad2Local(date.getHours())}:${pad2Local(date.getMinutes())}`;
};

// A no-op wall-clock passthrough (just appending :00 seconds) - the
// datetime-local input's own value is already the exact local string the
// backend wants, no Date object/timezone math involved.
export const fromDateTimeLocalValue = (value: string): string => `${value}:00`;

// "09:00" - hour ruler labels.
export const formatTimeLabel = (minutesSinceMidnight: number): string =>
  `${pad2Local(Math.floor(minutesSinceMidnight / 60))}:${pad2Local(minutesSinceMidnight % 60)}`;

export const formatDateTimeLabel = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'});
};

export const snapMinutes = (minutes: number, step = 15): number => Math.round(minutes / step) * step;

// "Now" rounded to 15min if logging for today, else a fixed 09:00 - the
// default start time for a brand-new entry that wasn't drag-selected on the
// grid (the plain "+" buttons, MyWorklogWidget's quick-log popup, ...).
export const defaultLogDateTime = (date: string): string => {
  if (date !== todayIso()) {
    return combineLocalDateAndMinutes(date, 9 * 60);
  }

  const now = new Date();
  return combineLocalDateAndMinutes(date, snapMinutes(now.getHours() * 60 + now.getMinutes()));
};

// Shifts the calendar day while preserving local time-of-day - real Date
// math (not the UTC-anchored addDays above), so it stays correct across a
// DST transition.
export const shiftDateTimeByDays = (iso: string, days: number): string => {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return toLocalDateTimeString(date);
};
