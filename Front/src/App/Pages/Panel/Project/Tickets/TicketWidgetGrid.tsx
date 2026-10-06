import type {ReactNode} from 'react';
import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import GridLayout, {WidthProvider} from 'react-grid-layout';
import type {Layout} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {Maximize2, Minimize2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {GRID_COLUMNS} from './ticketLayoutTemplates';
import {WIDGET_MIN_SIZE} from './TicketWidgets/widgetRegistry';
import type {WidgetId, WidgetLayoutItem} from '@/lib/TicketLayout/Type/types';

// react-grid-layout@2's full rewrite (gridConfig/dragConfig/resizeConfig,
// useContainerWidth instead of WidthProvider) turned out to have drag AND
// resize completely non-functional in this app (React 19.2.5) - confirmed
// directly in devtools: the underlying react-draggable DraggableCore
// correctly enters its `dragging` state on mousedown (handlers are wired,
// nothing's disabled), but its onDrag/onResize/onResizeStop callbacks never
// actually fire on move/mouseup, through both synthetic and genuine
// OS-level drag input - nothing ever repositions or resizes. Pinned back to
// the long-established 1.x line (npm dist-tag "legacy") instead: the
// classic WidthProvider HOC + flat-props API this file uses below, with
// years of real-world production usage and no such regression.
const ResponsiveGridLayout = WidthProvider(GridLayout);

// Pixel height one grid row represents - every WidgetLayoutItem.h in
// ticketLayoutTemplates.ts (and whatever the My Profile editor produces) is
// a multiple of this.
const GRID_ROW_HEIGHT = 24;
const GRID_MARGIN: [number, number] = [16, 16];

// Deliberately subtle (soft border/background, muted icon) rather than a
// solid, attention-grabbing control, since it sits on every tile at once.
const MAXIMIZE_BUTTON_CLASSNAME =
  'absolute right-0 top-0 z-10 h-5 w-5 min-w-0 translate-x-1/2 -translate-y-1/2 rounded-md border border-border/60 bg-card/80 text-muted-foreground/80 shadow-sm backdrop-blur-sm hover:border-border hover:bg-muted hover:text-foreground';

type TicketWidgetGridProps = {
  layout: WidgetLayoutItem[];
  // Not every widgetId in `layout` necessarily has an entry here (e.g. isNew
  // filters most of them out before this component ever sees them) -
  // whichever ones are missing are simply skipped, not rendered as empty tiles.
  widgets: Partial<Record<WidgetId, ReactNode>>;
  // The My Profile layout editor turns these on - a real ticket is never
  // rendered in edit mode there, so this defaults off. Maximize (see below)
  // is the opposite: only meaningful against real widget content, so it's
  // hidden whenever this is true (a placeholder label tile has nothing
  // worth filling the screen with).
  editable?: boolean;
  onLayoutChange?: (layout: WidgetLayoutItem[]) => void;
  // Identifies which ticket `widgets` currently belongs to (draft.id from
  // TicketEditor) - `layout` itself is a per-user preference, not per-
  // ticket, so it stays the very same array reference across navigating to
  // a sibling/child/parent ticket (TicketEditor deliberately never remounts
  // for that - see its own FetchState comment) and can't be used to detect
  // it. Only consumed below to reset the maximize state; doesn't affect
  // rendering.
  ticketKey?: string;
};

const TicketWidgetGrid = ({layout, widgets, editable = false, onLayoutChange, ticketKey}: TicketWidgetGridProps) => {
  const placedItems = layout.filter((item) => widgets[item.widgetId] !== undefined);

  // Purely local, transient UI state - deliberately never touches
  // onLayoutChange/the saved layout preference, and resets to null the
  // moment the ticket this grid is showing changes underneath it (adjusted
  // during render, React's own documented pattern for this - not an effect,
  // since `layout` itself is a per-user preference and stays the exact same
  // array reference across navigating to a sibling/child/parent ticket;
  // TicketEditor deliberately never remounts for that, see its own
  // FetchState comment - so ticketKey is the only signal that actually
  // changes).
  const [maximizedWidgetId, setMaximizedWidgetId] = useState<WidgetId | null>(null);
  const [maximizeResetKey, setMaximizeResetKey] = useState(ticketKey);

  if (ticketKey !== maximizeResetKey) {
    setMaximizeResetKey(ticketKey);
    setMaximizedWidgetId(null);
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [maximizedHeightPx, setMaximizedHeightPx] = useState<number | null>(null);

  // A maximized tile's "100% height" is whatever room the grid's own
  // ancestor (TicketEditor's scroll region) actually has, not some
  // arbitrary row count - measured live off containerRef once `h-full`
  // hands it that ancestor's height (see the className below), so the
  // maximized tile fills the visible area exactly instead of over/under-
  // shooting it. This is only ever approximate (row-unit rounding, react-
  // grid-layout's own container-padding math) - `overflow-hidden` on
  // containerRef (see the className below) is what actually guarantees no
  // outer scroll if this over-estimates by a few pixels, not precision
  // here. The widget's own content still scrolls fully via its own
  // internal overflow-y-auto (TicketWidgetCard, MarkdownEditor, ...)
  // regardless of exactly how tall the tile ends up.
  useLayoutEffect(() => {
    if (!maximizedWidgetId || !containerRef.current) {
      setMaximizedHeightPx(null);
      return;
    }

    const element = containerRef.current;
    const updateHeight = () => setMaximizedHeightPx(element.clientHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [maximizedWidgetId]);

  useEffect(() => {
    if (!maximizedWidgetId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMaximizedWidgetId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maximizedWidgetId]);

  // Inverts react-grid-layout's own containerHeight formula (height = nbRow
  // * rowHeight + (nbRow - 1) * marginY + containerPaddingY * 2, with
  // containerPaddingY defaulting to marginY when unset, as here) for nbRow.
  const maximizedRows = maximizedHeightPx
    ? Math.max(WIDGET_MIN_SIZE.h, Math.floor((maximizedHeightPx - GRID_MARGIN[1]) / (GRID_ROW_HEIGHT + GRID_MARGIN[1])))
    : WIDGET_MIN_SIZE.h;

  // minW/minH only matter while actually resizable - applied regardless of
  // what's persisted, so a stray tiny saved size (or a slot someone edited
  // before this floor existed) can't leave a tile impossible to grab again.
  // `Layout` here is a SINGLE item's shape (@types/react-grid-layout names
  // it that way, unlike the array-typed `Layout` in v2's own bundled types
  // this file used to import before the downgrade) - the array is `Layout[]`.
  //
  // Every placed item stays a react-grid-layout CHILD (and keeps its own
  // key) regardless of maximize state - only the x/y/w/h values fed to the
  // grid change. Moving a widget to/from some other parent (e.g. a separate
  // "hidden" container while maximized) would change its position in the
  // React tree and remount it (losing whatever live state it holds, like an
  // in-progress comment draft or a running worklog stopwatch) every time
  // maximize toggles - staying put and only repositioning avoids that
  // entirely. Every non-maximized item collapses to {x:0, y:0, w:1, h:1} -
  // they're `invisible` (see below) and `allowOverlap` (see the grid props)
  // means react-grid-layout never repositions them to avoid "colliding"
  // with each other, so the exact spot doesn't matter, only that it never
  // extends past the maximized item's own bottom edge (row 0 never does).
  const rglLayout: Layout[] = placedItems.map((item) => {
    const isMaximized = item.widgetId === maximizedWidgetId;
    const position = maximizedWidgetId
      ? isMaximized
        ? {x: 0, y: 0, w: GRID_COLUMNS, h: maximizedRows}
        : {x: 0, y: 0, w: 1, h: 1}
      : {x: item.x, y: item.y, w: item.w, h: item.h};

    return {
      i: item.widgetId,
      ...position,
      ...(editable ? {minW: WIDGET_MIN_SIZE.w, minH: WIDGET_MIN_SIZE.h} : {}),
    };
  });

  return (
    // react-grid-layout's containerPadding defaults to `margin` on every
    // edge (16px), insetting column 0's left edge from the issue-type/
    // title row above it (which has no such inset) - containerPadding
    // itself can't be set asymmetrically (its horizontal component applies
    // to left AND right equally), so instead this shifts the WHOLE grid
    // box 16px to the left via a negative margin. For a block box with an
    // auto (unset) width, a negative margin-left widens the auto-computed
    // width by that same amount while leaving the RIGHT edge exactly where
    // it already was (verified live: only the left edge moves, body/page
    // scrollWidth is unaffected - unlike zeroing containerPadding
    // horizontally, which also ate into the right side and produced a
    // visible gap against the header there instead). Left-only, deliberately
    // leaving the right side's default inset untouched.
    <div ref={containerRef} className={maximizedWidgetId ? 'h-full overflow-hidden' : undefined} style={{marginLeft: -GRID_MARGIN[0]}}>
      <ResponsiveGridLayout
        className="w-full"
        layout={rglLayout}
        cols={GRID_COLUMNS}
        rowHeight={GRID_ROW_HEIGHT}
        margin={GRID_MARGIN}
        // See rglLayout's own comment - every non-maximized item shares the
        // same {x:0,y:0} spot while maximized, and without allowOverlap,
        // react-grid-layout's collision resolution (which runs regardless
        // of compactType - only allowOverlap skips it) staggers them apart
        // to avoid "colliding", inflating the grid's own computed height
        // well past what's actually visible.
        compactType={maximizedWidgetId ? null : 'vertical'}
        allowOverlap={!!maximizedWidgetId}
        isDraggable={editable && !maximizedWidgetId}
        isResizable={editable && !maximizedWidgetId}
        onLayoutChange={
          onLayoutChange
            ? (nextLayout: Layout[]) =>
                onLayoutChange(
                  nextLayout.map((entry) => ({
                    widgetId: entry.i as WidgetId,
                    x: entry.x,
                    y: entry.y,
                    w: entry.w,
                    h: entry.h,
                  })),
                )
            : undefined
        }
      >
        {placedItems.map((item) => {
          const isMaximized = item.widgetId === maximizedWidgetId;
          const hiddenByMaximize = !!maximizedWidgetId && !isMaximized;

          return (
            <div key={item.widgetId} className={cn('relative', hiddenByMaximize && 'invisible')}>
              {!editable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disableRipple
                  onClick={() => setMaximizedWidgetId(isMaximized ? null : item.widgetId)}
                  // Straddles the tile's own top-right corner (half in, half
                  // out, via the translate - not just inset inside it) so it
                  // never sits over a widget's own content, which for some
                  // widgets (e.g. DescriptionWidget's MarkdownEditor,
                  // rendered edge-to-edge with no TicketWidgetCard padding
                  // gutter) used to land right on top of that widget's own
                  // toolbar. A plain sibling of the widget's own content,
                  // not portaled anywhere - containerRef's overflow-hidden
                  // above means the tile itself never needs to scroll, so
                  // there's nothing for this to drift away from.
                  className={MAXIMIZE_BUTTON_CLASSNAME}
                  title={isMaximized ? 'Restore' : 'Maximize'}
                >
                  {isMaximized ? <Minimize2 className="h-2.5 w-2.5" /> : <Maximize2 className="h-2.5 w-2.5" />}
                </Button>
              )}
              {widgets[item.widgetId]}
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
};

export default TicketWidgetGrid;
