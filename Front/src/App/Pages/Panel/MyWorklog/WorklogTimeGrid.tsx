import {useEffect, useRef, useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {Plus} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {
  combineLocalDateAndMinutes,
  formatDuration,
  formatTimeLabel,
  formatWeekdayLabel,
  localDateOf,
  minutesSinceMidnightLocal,
  snapMinutes,
  todayIso,
} from '@/lib/Worklog/dateRange';
import WorklogTimeBlock from './WorklogTimeBlock';
import {computeDayLayout} from './worklogTimeGridLayout';
import type {MyWorklogEntry} from '@/lib/Worklog/Type/types';

const HOUR_ROW_HEIGHT_PX = 48;
const TOTAL_HEIGHT_PX = HOUR_ROW_HEIGHT_PX * 24;
const HOURS = Array.from({length: 24}, (_, i) => i);
const RULER_WIDTH_PX = 44;
// A drag shorter than this is treated as a plain click - opens the popup at
// that time with a default duration instead of a (barely visible,
// hard-to-hit) sub-15min selection.
const CLICK_THRESHOLD_MINUTES = 15;
const DEFAULT_CLICK_DURATION_MINUTES = 30;
const MIN_DURATION_MINUTES = 15;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const nowMinutesSinceMidnight = (): number => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// Best-effort - some browsers throw (e.g. if the pointer was already
// released/never became "active" on this element by the time it's called).
// Failing silently and falling back to the plain window listeners is far
// better than an uncaught exception aborting the rest of a drag's setup -
// which, since capture used to be called before setMoveDrag/addEventListener,
// was silently preventing the drag from starting at all whenever it threw.
const trySetPointerCapture = (el: HTMLElement | null, pointerId: number): void => {
  try {
    el?.setPointerCapture(pointerId);
  } catch {
    // Intentionally ignored - see comment above.
  }
};

const tryReleasePointerCapture = (el: HTMLElement | null, pointerId: number): void => {
  try {
    el?.releasePointerCapture(pointerId);
  } catch {
    // Intentionally ignored - releasing a capture that's already gone
    // (pointerup can auto-release it) throws in some browsers too.
  }
};

type DragSelection = {date: string; topPx: number; heightPx: number};
type DragInfo = {date: string; startY: number; columnTop: number};

// A block being dragged to a new day/time - rendered as a single floating
// element outside the normal per-column loop (see the render below) so it
// can visually cross day columns instead of being clipped by the origin
// column's own `overflow-hidden`. leftPx/widthPx are measured straight off
// the target column's own real DOM rect (see columnRefs) rather than
// derived from rowRect.width/days.length - that division ignores the
// gap-1.5 between columns, which was consistently overshooting the ghost's
// width into the neighboring column's space.
type MoveDrag = {entryId: string; dayIndex: number; leftPx: number; widthPx: number; topPx: number; heightPx: number};
// A block's bottom edge being dragged to change its duration - day/start
// time are fixed, only heightPx (and thus the derived end time) moves.
type ResizeDrag = {entryId: string; dayIndex: number; topPx: number; heightPx: number};

type WorklogTimeGridProps = {
  days: string[];
  entriesByDate: Record<string, MyWorklogEntry[]>;
  loading: boolean;
  deletingId: string | null;
  onDelete: (entry: MyWorklogEntry) => void;
  onLogClick: (date: string) => void;
  onRangeSelect: (date: string, dateTimeIso: string, durationMinutes: number) => void;
  onCopy: (entry: MyWorklogEntry, dayShift: 0 | 1) => void;
  copyingId: string | null;
  // Fired once a drag/resize is dropped somewhere different from where the
  // entry started - newDateTime is the same zoneless local datetime string
  // as everywhere else (see dateRange.ts), newDurationMinutes only changes
  // for a resize (a move keeps the entry's existing duration).
  onMove: (entry: MyWorklogEntry, newDateTime: string) => void;
  onResize: (entry: MyWorklogEntry, newDurationMinutes: number) => void;
  updatingId: string | null;
  // Double-click on a block - opens the same "Log time" popup, pre-filled
  // for editing this entry instead of creating a new one (see
  // MyWorklogPage's openEditPopup).
  onEdit: (entry: MyWorklogEntry) => void;
  showActor: boolean;
  currentUserId: string | null;
  // Week shows a per-column header (weekday label, day total, drill-in,
  // "+"); Day already has its own bigger heading above this component, so it
  // passes false and skips this row entirely.
  showColumnHeaders?: boolean;
  onDayHeaderClick?: (date: string) => void;
};

// Shared hour-ruler grid behind MyWorklogDayView (1 column) and
// MyWorklogWeekView (7 columns) - full available height (scrollable
// internally, per this app's `min-h-0 flex-1 overflow-y-auto` convention),
// an hour scale down the left edge, entries positioned by their actual
// dateTime, and pointer-drag-to-select-a-period on any empty grid space.
const WorklogTimeGrid = ({
  days,
  entriesByDate,
  loading,
  deletingId,
  onDelete,
  onLogClick,
  onRangeSelect,
  onCopy,
  copyingId,
  onMove,
  onResize,
  updatingId,
  onEdit,
  showActor,
  currentUserId,
  showColumnHeaders = false,
  onDayHeaderClick,
}: WorklogTimeGridProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRowRef = useRef<HTMLDivElement>(null);
  // One real DOM node per day column, indexed by dayIndex - lets the move-
  // drag ghost measure its target column's exact rect (see handleBlockMoveStart)
  // instead of approximating column width as rowRect.width / days.length,
  // which ignores the gap-1.5 between columns.
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragInfoRef = useRef<DragInfo | null>(null);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);
  const [moveDrag, setMoveDrag] = useState<MoveDrag | null>(null);
  const [resizeDrag, setResizeDrag] = useState<ResizeDrag | null>(null);
  const [nowMinutes, setNowMinutes] = useState(nowMinutesSinceMidnight);
  const today = todayIso();
  const nowTopPx = (nowMinutes / 1440) * TOTAL_HEIGHT_PX;

  // Keeps the "now" line moving without a full remount - a plain minute-
  // resolution indicator doesn't need anything finer than this.
  useEffect(() => {
    const id = setInterval(() => setNowMinutes(nowMinutesSinceMidnight()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Runs once on mount only (not on every days/range change) so paging
  // between weeks doesn't keep yanking the user's scroll position back -
  // same precedent as the old unconditional "always open at 7am" version
  // this replaced. Centers on the "now" line when today is part of the
  // visible range, falling back to that old 7am default otherwise (e.g.
  // Day view on a different date, or a week that doesn't include today).
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    if (!days.includes(today)) {
      container.scrollTo({top: 7 * HOUR_ROW_HEIGHT_PX});
      return;
    }

    container.scrollTo({top: Math.max(0, (nowMinutesSinceMidnight() / 1440) * TOTAL_HEIGHT_PX - HOUR_ROW_HEIGHT_PX * 2)});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only, see comment above
  }, []);

  // A drop that actually changed something leaves moveDrag/resizeDrag set
  // (see handleBlockMoveStart/handleBlockResizeStart's handleUp) instead of
  // clearing them immediately, so the block stays frozen at its dropped
  // position through the save - clearing it as soon as the pointer lifts
  // would flash the real block back to its old (not-yet-saved) position for
  // a moment, then jump again once the save+refetch actually lands. Once
  // updatingId cycles back off whichever entry was in flight (the parent's
  // handleMove/handleResize only clear it after their own refetch resolves,
  // see MyWorklogPage), entriesByDate already reflects the new position, so
  // it's safe to drop the ghost and let the real, freshly laid-out block
  // take over.
  const prevUpdatingIdRef = useRef(updatingId);
  useEffect(() => {
    const finishedEntryId = prevUpdatingIdRef.current;
    prevUpdatingIdRef.current = updatingId;

    if (!finishedEntryId || finishedEntryId === updatingId) {
      return;
    }

    setMoveDrag((current) => (current?.entryId === finishedEntryId ? null : current));
    setResizeDrag((current) => (current?.entryId === finishedEntryId ? null : current));
  }, [updatingId]);

  const handleColumnPointerDown = (date: string) => (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    // Stops the browser's own press-and-drag text selection from starting -
    // isDragging's select-none above only limits the damage once it's
    // already begun.
    event.preventDefault();

    const columnTop = event.currentTarget.getBoundingClientRect().top;
    const startY = clamp(event.clientY - columnTop, 0, TOTAL_HEIGHT_PX);
    const pointerId = event.pointerId;
    const captureTarget = event.currentTarget;

    dragInfoRef.current = {date, startY, columnTop};
    setDragSelection({date, topPx: startY, heightPx: 0});

    const cleanup = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
      tryReleasePointerCapture(captureTarget, pointerId);
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return;
      }

      const info = dragInfoRef.current;
      if (!info) {
        return;
      }

      const y = clamp(moveEvent.clientY - info.columnTop, 0, TOTAL_HEIGHT_PX);
      setDragSelection({date: info.date, topPx: Math.min(info.startY, y), heightPx: Math.abs(y - info.startY)});
    };

    const handleCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) {
        return;
      }

      cleanup();
      dragInfoRef.current = null;
      setDragSelection(null);
    };

    const handleUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return;
      }

      cleanup();

      const info = dragInfoRef.current;
      dragInfoRef.current = null;
      setDragSelection(null);

      if (!info) {
        return;
      }

      const y = clamp(upEvent.clientY - info.columnTop, 0, TOTAL_HEIGHT_PX);
      const rawStart = (Math.min(info.startY, y) / TOTAL_HEIGHT_PX) * 1440;
      const rawEnd = (Math.max(info.startY, y) / TOTAL_HEIGHT_PX) * 1440;

      if (rawEnd - rawStart < CLICK_THRESHOLD_MINUTES) {
        const clickMinute = snapMinutes(rawStart);
        onRangeSelect(info.date, combineLocalDateAndMinutes(info.date, clickMinute), DEFAULT_CLICK_DURATION_MINUTES);
        return;
      }

      const startMinute = snapMinutes(rawStart);
      const endMinute = snapMinutes(rawEnd);
      onRangeSelect(info.date, combineLocalDateAndMinutes(info.date, startMinute), Math.max(15, endMinute - startMinute));
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
    // Pointer Capture, not just window listeners - without it, a drag that
    // moves fast enough to leave the browser's own surface (or otherwise
    // hits a pointerup the page never receives) left these listeners
    // attached forever: the selection kept following the mouse, and the
    // NEXT unrelated click got misread as this drag's drop. Called last
    // (after the state/listeners it's meant to protect are already live) so
    // a browser that throws here doesn't take the rest of drag-start down
    // with it - see trySetPointerCapture's own comment.
    trySetPointerCapture(captureTarget, pointerId);
  };

  // Drags an existing block to a new day/time. Started from the block's own
  // pointerdown (see WorklogTimeBlock) - dayIndex/topPx/heightPx are the
  // block's own resting position at drag-start, read off the same
  // computeDayLayout result the block is normally rendered from, so the
  // ghost starts out exactly where the real block was.
  const handleBlockMoveStart =
    (entry: MyWorklogEntry, dayIndex: number, topPx: number, heightPx: number) => (event: ReactPointerEvent) => {
      // Always stop propagation, even for a non-left button - a right-click
      // still has to swallow the pointerdown so it doesn't fall through to
      // the grid's own drag-to-select underneath (that's what a stray click
      // - e.g. dismissing the block's context menu - was popping the "log
      // time" popup open on drop).
      event.stopPropagation();

      if (event.button !== 0) {
        return;
      }

      // Stops the browser's own press-and-drag text selection from
      // starting - see handleColumnPointerDown's own comment.
      event.preventDefault();

      const rowRect = gridRowRef.current?.getBoundingClientRect();
      if (!rowRect) {
        return;
      }

      const pointerId = event.pointerId;

      const pointerOffsetY = event.clientY - rowRect.top - topPx;
      // Approximate - only used to decide which day the pointer is over,
      // not to size/position anything, so ignoring the gap-1.5 between
      // columns here is fine (worst case the hit-test flips a few px early/
      // late near a gap). The ghost's actual rect always comes from the
      // real column DOM node instead (see columnRect below).
      const columnWidth = rowRect.width / days.length;

      const columnRect = (idx: number) => {
        const colRect = columnRefs.current[idx]?.getBoundingClientRect();
        return colRect ? {leftPx: colRect.left - rowRect.left, widthPx: colRect.width} : {leftPx: 0, widthPx: columnWidth};
      };

      setMoveDrag({entryId: entry.id, dayIndex, ...columnRect(dayIndex), topPx, heightPx});

      const resolve = (moveEvent: PointerEvent) => {
        const x = clamp(moveEvent.clientX - rowRect.left, 0, rowRect.width - 1);
        const nextDayIndex = clamp(Math.floor(x / columnWidth), 0, days.length - 1);
        const nextTopPx = clamp(moveEvent.clientY - rowRect.top - pointerOffsetY, 0, TOTAL_HEIGHT_PX - heightPx);
        return {nextDayIndex, nextTopPx};
      };

      const cleanup = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleCancel);
        tryReleasePointerCapture(gridRowRef.current, pointerId);
      };

      const handleMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) {
          return;
        }

        const {nextDayIndex, nextTopPx} = resolve(moveEvent);
        setMoveDrag({entryId: entry.id, dayIndex: nextDayIndex, ...columnRect(nextDayIndex), topPx: nextTopPx, heightPx});
      };

      // Gesture got interrupted (e.g. the UA lost track of the pointer) -
      // drop the ghost without saving anything, same as a same-slot no-op.
      const handleCancel = (cancelEvent: PointerEvent) => {
        if (cancelEvent.pointerId !== pointerId) {
          return;
        }

        cleanup();
        setMoveDrag(null);
      };

      const handleUp = (upEvent: PointerEvent) => {
        if (upEvent.pointerId !== pointerId) {
          return;
        }

        cleanup();

        const {nextDayIndex, nextTopPx} = resolve(upEvent);
        const newDate = days[nextDayIndex];
        const newStartMinute = snapMinutes((nextTopPx / TOTAL_HEIGHT_PX) * 1440);

        if (newDate === localDateOf(entry.dateTime) && newStartMinute === minutesSinceMidnightLocal(entry.dateTime)) {
          // Nothing to save - nothing to wait for either, drop the ghost
          // immediately.
          setMoveDrag(null);
          return;
        }

        // Left set (not cleared) - see the updatingId effect above for why.
        setMoveDrag({entryId: entry.id, dayIndex: nextDayIndex, ...columnRect(nextDayIndex), topPx: nextTopPx, heightPx});
        onMove(entry, combineLocalDateAndMinutes(newDate, newStartMinute));
      };

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleCancel);
      // Captured on the row container, not the block itself (which
      // unmounts the instant moveDrag is set above, see the render below) -
      // called last, see trySetPointerCapture's own comment on why.
      trySetPointerCapture(gridRowRef.current, pointerId);
    };

  // Drags a block's bottom edge to change its duration - day and start time
  // never change, only heightPx (and the duration derived from it).
  const handleBlockResizeStart = (entry: MyWorklogEntry, dayIndex: number, topPx: number, startHeightPx: number) => (event: ReactPointerEvent) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    // Stops the browser's own press-and-drag text selection from starting -
    // see handleColumnPointerDown's own comment.
    event.preventDefault();

    const rowRect = gridRowRef.current?.getBoundingClientRect();
    if (!rowRect) {
      return;
    }

    const minHeightPx = (MIN_DURATION_MINUTES / 1440) * TOTAL_HEIGHT_PX;
    const pointerId = event.pointerId;

    const resolveHeight = (moveEvent: PointerEvent) => clamp(moveEvent.clientY - rowRect.top - topPx, minHeightPx, TOTAL_HEIGHT_PX - topPx);

    setResizeDrag({entryId: entry.id, dayIndex, topPx, heightPx: startHeightPx});

    const cleanup = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleCancel);
      tryReleasePointerCapture(gridRowRef.current, pointerId);
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) {
        return;
      }

      setResizeDrag({entryId: entry.id, dayIndex, topPx, heightPx: resolveHeight(moveEvent)});
    };

    const handleCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId !== pointerId) {
        return;
      }

      cleanup();
      setResizeDrag(null);
    };

    const handleUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) {
        return;
      }

      cleanup();

      const heightPx = resolveHeight(upEvent);
      const startMinute = minutesSinceMidnightLocal(entry.dateTime);
      const endMinute = snapMinutes(startMinute + (heightPx / TOTAL_HEIGHT_PX) * 1440);
      const newDuration = Math.max(MIN_DURATION_MINUTES, endMinute - startMinute);

      if (newDuration === entry.minutes) {
        setResizeDrag(null);
        return;
      }

      // Left set (not cleared) - see the updatingId effect above for why.
      setResizeDrag({entryId: entry.id, dayIndex, topPx, heightPx});
      onResize(entry, newDuration);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleCancel);
    trySetPointerCapture(gridRowRef.current, pointerId);
  };

  // Any of the three drag gestures dragging text (ticket titles, time
  // labels, ...) into a native text selection instead of moving it - each
  // pointerdown below also calls preventDefault to stop that at the source,
  // this is the belt-and-suspenders backup for whatever a fast drag still
  // sweeps over before the browser catches up.
  const isDragging = dragSelection !== null || moveDrag !== null || resizeDrag !== null;

  return (
    <div className={cn('flex h-full min-h-0 flex-col', isDragging && 'select-none')}>
      {loading && <p className="shrink-0 pb-1 text-xs text-muted-foreground">Loading…</p>}

      {showColumnHeaders && (
        <div className="flex shrink-0 border-b border-border pb-2">
          <div style={{width: RULER_WIDTH_PX}} className="shrink-0" />

          <div className="grid flex-1 gap-1.5" style={{gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`}}>
            {days.map((date) => {
              const entries = entriesByDate[date] ?? [];
              const total = entries.reduce((sum, entry) => sum + entry.minutes, 0);
              const isToday = date === today;

              return (
                <div key={date} className="flex items-center justify-between gap-1 px-1">
                  <button
                    type="button"
                    onClick={() => onDayHeaderClick?.(date)}
                    className={cn('flex flex-col items-start text-left', isToday ? 'text-accent' : 'text-foreground')}
                  >
                    <span className="text-xs font-medium hover:underline">
                      {formatWeekdayLabel(date)} {Number(date.slice(8, 10))}
                    </span>
                    {total > 0 && <span className="text-[10px] text-muted-foreground">{formatDuration(total)}</span>}
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    disableRipple
                    onClick={() => onLogClick(date)}
                    className="h-5 w-5 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-accent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex" style={{height: TOTAL_HEIGHT_PX}}>
          <div style={{width: RULER_WIDTH_PX}} className="sticky left-0 z-10 shrink-0 bg-card">
            {HOURS.map((hour) => (
              <div key={hour} style={{height: HOUR_ROW_HEIGHT_PX}} className="border-t border-border/40 pr-1.5 text-right">
                <span className="relative -top-2 text-[10px] text-muted-foreground">{formatTimeLabel(hour * 60)}</span>
              </div>
            ))}
          </div>

          <div ref={gridRowRef} className="relative grid flex-1 gap-1.5" style={{gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`}}>
            {days.map((date, dayIndex) => {
              const entries = entriesByDate[date] ?? [];
              const laidOut = computeDayLayout(entries, TOTAL_HEIGHT_PX);
              const isToday = date === today;

              return (
                <div
                  key={date}
                  ref={(el) => {
                    columnRefs.current[dayIndex] = el;
                  }}
                  onPointerDown={handleColumnPointerDown(date)}
                  // A neutral (--foreground) tint just pales into Neon Blaster's colorful page-wide glow (Background.tsx) instead of reading as a deliberate panel - a color wash (--accent) survives that background far better, hence every column using it, just at a lower opacity than the isToday one. Rounded + a gap between columns (instead of the old border-l divider) so each day reads as its own panel rather than one continuous wash.
                  className={cn('relative overflow-hidden rounded-md', isToday ? 'bg-accent/30' : 'bg-accent/12')}
                >
                  {HOURS.map((hour) => (
                    <div key={hour} style={{height: HOUR_ROW_HEIGHT_PX}} className="border-t border-border/20" />
                  ))}

                  {dragSelection?.date === date && (
                    <div
                      className="pointer-events-none absolute inset-x-0 rounded-md border border-accent/50 bg-accent/20"
                      style={{top: dragSelection.topPx, height: dragSelection.heightPx}}
                    />
                  )}

                  {isToday && (
                    // left-0 (not a negative offset) - the column clips with overflow-hidden for its rounded corners, which would otherwise cut the dot off.
                    <div className="pointer-events-none absolute inset-x-0 z-20" style={{top: nowTopPx}}>
                      <div className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-destructive" />
                      <div className="h-0.5 bg-destructive" />
                    </div>
                  )}

                  {laidOut.map(({entry, topPx, heightPx, leftPercent, widthPercent}) => {
                    // Being dragged to a new day/time right now - rendered
                    // as the floating ghost below instead (which can cross
                    // this column's own overflow-hidden boundary), so skip
                    // the normal in-place render entirely rather than
                    // showing it twice.
                    if (moveDrag?.entryId === entry.id) {
                      return null;
                    }

                    const resizing = resizeDrag?.entryId === entry.id;

                    return (
                      <WorklogTimeBlock
                        key={entry.id}
                        entry={entry}
                        style={{
                          top: resizing ? resizeDrag.topPx : topPx,
                          height: resizing ? resizeDrag.heightPx : heightPx,
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        onDelete={onDelete}
                        deleting={deletingId === entry.id}
                        onCopy={onCopy}
                        copying={copyingId === entry.id}
                        updating={updatingId === entry.id}
                        showActor={showActor}
                        canEdit={entry.actorId === currentUserId}
                        onMoveStart={handleBlockMoveStart(entry, dayIndex, topPx, heightPx)}
                        onResizeStart={handleBlockResizeStart(entry, dayIndex, topPx, heightPx)}
                        onEdit={onEdit}
                      />
                    );
                  })}
                </div>
              );
            })}

            {moveDrag &&
              (() => {
                const entry = Object.values(entriesByDate)
                  .flat()
                  .find((candidate) => candidate.id === moveDrag.entryId);

                if (!entry) {
                  return null;
                }

                const startMinutes = snapMinutes((moveDrag.topPx / TOTAL_HEIGHT_PX) * 1440);
                const endMinutes = startMinutes + entry.minutes;

                return (
                  <div
                    className="pointer-events-none absolute overflow-hidden rounded-md border border-accent bg-accent/30 px-1.5 py-1 text-[11px] leading-tight shadow-lg"
                    style={{left: moveDrag.leftPx, width: moveDrag.widthPx, top: moveDrag.topPx, height: moveDrag.heightPx}}
                  >
                    <span className="font-medium text-accent">
                      {formatTimeLabel(startMinutes)}–{formatTimeLabel(Math.min(endMinutes, 1440))}
                    </span>
                    <div className="truncate text-foreground">
                      <span className="text-muted-foreground">{entry.ticket.key}</span> {entry.ticket.title}
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorklogTimeGrid;
