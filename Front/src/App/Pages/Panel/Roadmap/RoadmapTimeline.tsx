import {useEffect, useMemo, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {addDays, formatDayLabel, todayIso} from '@/lib/Worklog/dateRange';
import {getReleaseStatusLabel} from '@/lib/Release/releaseStatuses';
import {getAfterCarePeriodDays, getAfterCarePeriodLabel} from '@/lib/Release/afterCarePeriods';
import RoadmapReleasePanel from './RoadmapReleasePanel';
import type {RoadmapRelease} from '@/lib/Roadmap/Type/types';

type RoadmapTimelineProps = {
  releases: RoadmapRelease[];
  projectNamesById: Map<string, string>;
  windowStart: string;
  weeksVisible: number;
  onPan: (deltaDays: number) => void;
  onToday: () => void;
  onZoom: (direction: 'in' | 'out') => void;
  onReleaseSaved: (release: RoadmapRelease) => void;
  loading: boolean;
};

// The floor, not the fixed value anymore - see the containerWidth
// ResizeObserver below, which stretches each day wider than this when the
// window has room to spare (few weeks visible on a wide screen). Many weeks
// visible still falls back to exactly this, and scrollRef's overflow-x-auto
// takes over exactly as before.
const MIN_DAY_WIDTH_PX = 14;
const ROW_HEIGHT_PX = 40;
const GUTTER_WIDTH_PX = 240;
// A release only has ONE date (plannedReleaseDate), not a start+end range
// like the earlier per-ticket design's bars had - this is a fixed display
// width (not a real duration) just so the bar is wide enough to read a
// label inside it, same visual weight as a real Gantt bar. The release
// date is the bar's LEFT edge, not its center - "the stretch of time
// leading up to shipping this version".
const BAR_WIDTH_DAYS = 7;

// PLAN vs RELEASED (see releaseStatuses.ts - only two values) - colored by
// status rather than by project, since "has this shipped yet" is the one
// piece of information worth seeing at a glance across a wall of bars.
const STATUS_COLORS: Record<string, string> = {
  PLAN: '#22d3ee',
  RELEASED: '#34d399',
};

const daysBetween = (fromIso: string, toIsoDate: string): number => {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIsoDate}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
};

// One row per RELEASE (not grouped by project - a flat, date-sorted list
// reads more like a classic Gantt), each a colored bar labeled with its
// version/name so there's something to actually read at a glance instead of
// a bare marker. Clicking a bar opens RoadmapReleasePanel inline below its
// row - the release's date and ticket list are editable straight from here
// (PUT .../release/{id}, same upsert Version Tracker's own ReleaseCard
// uses), not read-only.
const RoadmapTimeline = ({releases, projectNamesById, windowStart, weeksVisible, onPan, onToday, onZoom, onReleaseSaved, loading}: RoadmapTimelineProps) => {
  // Clicked, not hovered - a hover popover can't host the date field/ticket
  // search RoadmapReleasePanel needs (moving the pointer off the bar to
  // reach an input would close it). A Set, not a single id - opening one
  // release's panel shouldn't close whatever else is already open.
  const [expandedReleaseIds, setExpandedReleaseIds] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  // 0 until the first ResizeObserver callback fires (first paint uses
  // MIN_DAY_WIDTH_PX as a fallback, see dayWidthPx below) - tracks
  // scrollRef's own rendered width so the day grid can stretch to fill it
  // when there's room, and re-measures on every resize (window resize, a
  // Dashboard card's own layout changing, sidebar collapse, ...).
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Native (not React's synthetic onWheel) so preventDefault actually takes
  // effect - React attaches wheel listeners as passive by default, which
  // silently no-ops preventDefault. Only zooms with Ctrl/Cmd held (mirrors
  // the browser's own ctrl+scroll zoom gesture) - without that guard a plain
  // scroll over the timeline could never scroll the page, since every wheel
  // tick would be intercepted for zooming instead. A plain wheel tick (no
  // modifier) is left completely alone (no preventDefault) so the page
  // scrolls normally. Scrolling "up"/away from you (negative deltaY) zooms
  // in (fewer weeks fetched - see RoadmapPage's own handleZoom, which
  // actually widens/narrows the from/till fetch, not just the pixel width
  // of what's already loaded). Attached to scrollRef, which stays mounted
  // across loading/empty/populated states (see render below) - it used to
  // sit only on the populated branch, so zooming into a window with zero
  // releases unmounted the very element the listener was on and silently
  // killed scroll-to-zoom for good, even once releases reappeared (this
  // effect's deps never changed, so it never re-attached).
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }

      event.preventDefault();
      onZoom(event.deltaY < 0 ? 'in' : 'out');
    };

    element.addEventListener('wheel', handleWheel, {passive: false});
    return () => element.removeEventListener('wheel', handleWheel);
  }, [onZoom]);

  const totalDays = weeksVisible * 7;
  // Stretches beyond the floor when the container has room to spare (few
  // weeks visible, wide screen) - e.g. a wide dashboard card showing only 4
  // weeks gets fat, easy-to-read columns instead of a sliver of a chart with
  // blank space next to it. Falls back to the floor (and scrollRef's own
  // overflow-x-auto takes over) once more weeks are visible than the
  // container can fit at that floor width.
  const dayWidthPx = containerWidth > 0 ? Math.max(MIN_DAY_WIDTH_PX, (containerWidth - GUTTER_WIDTH_PX) / totalDays) : MIN_DAY_WIDTH_PX;
  const timelineWidth = totalDays * dayWidthPx;

  const weekTicks = useMemo(() => {
    const ticks: string[] = [];
    for (let i = 0; i < weeksVisible; i++) {
      ticks.push(addDays(windowStart, i * 7));
    }
    return ticks;
  }, [windowStart, weeksVisible]);

  const today = todayIso();
  const todayOffsetDays = daysBetween(windowStart, today);
  const todayVisible = todayOffsetDays >= 0 && todayOffsetDays <= totalDays;

  const sortedReleases = useMemo(
    () => [...releases].sort((a, b) => a.plannedReleaseDate.localeCompare(b.plannedReleaseDate)),
    [releases],
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            disableRipple
            onClick={() => onPan(-28)}
            className="h-7 w-7 min-w-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disableRipple
            onClick={() => onPan(28)}
            className="h-7 w-7 min-w-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {formatDayLabel(windowStart)} – {formatDayLabel(addDays(windowStart, totalDays - 1))}
        </p>
      </div>

      {/* Always mounted, loading/empty/populated alike - the wheel-zoom
          listener above lives on this element, so it must never unmount
          just because the current window happens to have zero releases in
          it (see that effect's own comment). */}
      <div ref={scrollRef} className="overflow-x-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading releases…</p>
        ) : sortedReleases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No releases planned in this window - try Prev/Next, or plan one from Version Tracker.</p>
        ) : (
          // width: 100% + minWidth (not a fixed width) - when the actual
          // date grid is narrower than the container (few weeks, wide
          // screen) this stretches the rows/borders out to fill the card
          // instead of leaving a hard-edged box with blank space to the
          // right; once the grid needs more than 100% (many weeks), minWidth
          // takes over and scrollRef's own overflow-x-auto kicks in exactly
          // as before.
          <div style={{width: '100%', minWidth: GUTTER_WIDTH_PX + timelineWidth}}>
            {/* Week header */}
            <div className="flex border-b border-border pb-1.5" style={{paddingLeft: GUTTER_WIDTH_PX}}>
              <div className="relative" style={{width: timelineWidth, height: 20}}>
                {weekTicks.map((tick) => (
                  <div
                    key={tick}
                    className="absolute top-0 border-l border-border/60 pl-1 text-[10px] whitespace-nowrap text-muted-foreground"
                    style={{left: daysBetween(windowStart, tick) * dayWidthPx}}
                  >
                    {formatDayLabel(tick)}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-0" style={{left: GUTTER_WIDTH_PX}}>
                {weekTicks.map((tick) => (
                  <div
                    key={tick}
                    className="absolute top-0 bottom-0 border-l border-border/30"
                    style={{left: daysBetween(windowStart, tick) * dayWidthPx}}
                  />
                ))}
                {todayVisible && (
                  <div className="absolute top-0 bottom-0 border-l-2 border-accent" style={{left: todayOffsetDays * dayWidthPx}} />
                )}
              </div>

              {sortedReleases.map((release) => {
                const projectName = projectNamesById.get(release.projectId) ?? release.projectId;
                const offsetDays = daysBetween(windowStart, release.plannedReleaseDate);
                const barLeft = offsetDays * dayWidthPx;
                const barWidth = BAR_WIDTH_DAYS * dayWidthPx;
                const color = STATUS_COLORS[release.status] ?? '#a1a1aa';
                const isExpanded = expandedReleaseIds.has(release.id);
                const label = release.name ? `${release.versionNumber} · ${release.name}` : release.versionNumber;
                // Optional post-release "after care" window - drawn as a
                // hatched strip running to the RIGHT of the release date
                // (the bar's left edge) for the period's length. Null/''
                // from the API -> 0 days -> nothing drawn, exactly as
                // before.
                const afterCareDays = getAfterCarePeriodDays(release.afterCarePeriod);
                const afterCareVisible = afterCareDays > 0 && offsetDays <= totalDays && offsetDays + afterCareDays >= 0;

                return (
                  <div key={release.id} className="flex flex-col border-b border-border/40">
                    <div className="flex items-center" style={{height: ROW_HEIGHT_PX}}>
                      {/* Sticky, not just in-flow - without this the gutter
                          scrolled away with the timeline underneath it,
                          taking the project/version label out of view along
                          with whatever week you'd scrolled to. bg-card (same
                          as the card's own background) keeps bars from
                          showing through as they slide underneath it. */}
                      <div
                        className="sticky left-0 z-6 shrink-0 truncate pr-3 text-sm text-foreground"
                        style={{width: GUTTER_WIDTH_PX}}
                        title={`${projectName} · ${label}`}
                      >
                        <span className="text-muted-foreground">{projectName}</span>{' '}
                        <span style={{color}}>{label}</span>
                      </div>

                      <div className="relative" style={{width: timelineWidth, height: ROW_HEIGHT_PX}}>
                        {afterCareVisible && (
                          <div
                            className="pointer-events-none absolute top-1/2 rounded-sm"
                            style={{
                              left: barLeft,
                              width: afterCareDays * dayWidthPx,
                              height: 6,
                              transform: 'translateY(7px)',
                              backgroundImage: `repeating-linear-gradient(45deg, ${color}, ${color} 2px, transparent 2px, transparent 5px)`,
                              borderRight: `2px solid ${color}`,
                            }}
                          />
                        )}
                        {offsetDays >= -BAR_WIDTH_DAYS && offsetDays <= totalDays && (
                          <button
                            type="button"
                            className="absolute top-1/2 flex h-6 -translate-y-1/2 cursor-pointer items-center rounded-md px-1.5 text-xs font-medium text-black"
                            style={{left: barLeft, width: barWidth, backgroundColor: color}}
                            onClick={() =>
                              setExpandedReleaseIds((current) => {
                                const next = new Set(current);
                                if (next.has(release.id)) {
                                  next.delete(release.id);
                                } else {
                                  next.add(release.id);
                                }
                                return next;
                              })
                            }
                            title={`${label} · ${getReleaseStatusLabel(release.status)} · ${release.plannedReleaseDate}${
                              afterCareDays > 0 ? ` · after care: ${getAfterCarePeriodLabel(release.afterCarePeriod)}` : ''
                            }`}
                          >
                            <span className="truncate">{label}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Slides out downward, in-flow (not a floating
                        popover) - pushes the rows below it down instead of
                        overlapping them. The grid-template-rows 0fr/1fr
                        trick animates height without knowing the panel's
                        actual (variable, ticket-count-dependent) height up
                        front. Indented by the bar's own x position (not
                        sticky - it should scroll WITH the bar it belongs
                        to, not stay pinned to the viewport's left edge) so
                        it opens directly under the bar that was clicked,
                        not off at the row's own left edge. */}
                    <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        {isExpanded && (
                          <div className="pb-3" style={{marginLeft: GUTTER_WIDTH_PX + Math.max(barLeft, 0)}}>
                            <RoadmapReleasePanel release={release} onSaved={onReleaseSaved} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapTimeline;
