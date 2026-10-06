import type {CSSProperties, PointerEventHandler} from 'react';
import {Link} from 'react-router-dom';
import {Pencil, Trash2} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {UserChip} from '@/components/ui/user-chip';
import {ContextMenu} from '@/components/ui/context-menu';
import {formatDuration, formatTimeLabel, minutesSinceMidnightLocal} from '@/lib/Worklog/dateRange';
import type {MyWorklogEntry} from '@/lib/Worklog/Type/types';

type WorklogTimeBlockProps = {
  entry: MyWorklogEntry;
  style: CSSProperties;
  onDelete: (entry: MyWorklogEntry) => void;
  deleting: boolean;
  onCopy: (entry: MyWorklogEntry, dayShift: 0 | 1) => void;
  copying: boolean;
  updating: boolean;
  showActor: boolean;
  // Own entries only - same restriction as delete, extended to dragging/
  // resizing (both are also edits to someone else's logged time).
  canEdit: boolean;
  onMoveStart: PointerEventHandler;
  onResizeStart: PointerEventHandler;
  onEdit: (entry: MyWorklogEntry) => void;
};

// One logged entry on WorklogTimeGrid's hour grid - the compact, absolutely-
// positioned counterpart to the old (now removed) WorklogEntryRow. Position/
// size come from the parent's computeDayLayout (or, mid-drag/resize, from
// WorklogTimeGrid's own moveDrag/resizeDrag state) - this component only
// renders content inside whatever box it's given, it doesn't compute layout
// itself.
const WorklogTimeBlock = ({entry, style, onDelete, deleting, onCopy, copying, updating, showActor, canEdit, onMoveStart, onResizeStart, onEdit}: WorklogTimeBlockProps) => {
  const startMinutes = minutesSinceMidnightLocal(entry.dateTime);
  const endMinutes = startMinutes + entry.minutes;

  return (
    <ContextMenu
      items={[
        {label: 'Copy', onSelect: () => onCopy(entry, 0)},
        {label: 'Copy to next day', onSelect: () => onCopy(entry, 1)},
      ]}
      className={cn(
        'group absolute overflow-hidden rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-1 text-[11px] leading-tight hover:bg-cyan-400/20',
        canEdit && 'cursor-grab active:cursor-grabbing',
      )}
      style={style}
      // A non-owned entry still has to swallow the pointerdown (so it
      // doesn't fall through to the grid's own drag-to-select underneath
      // it) without actually starting a move - onMoveStart itself already
      // calls stopPropagation for the owned case.
      onPointerDown={canEdit ? onMoveStart : (e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="shrink-0 font-medium text-accent">
          {formatTimeLabel(startMinutes)}–{formatTimeLabel(Math.min(endMinutes, 1440))}
        </span>

        {canEdit && (
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              disableRipple
              onClick={() => onEdit(entry)}
              onPointerDown={(e) => e.stopPropagation()}
              // opacity, not `hidden`/`flex` - toggling display on hover grew
              // this row by the button's own height and pushed the title/
              // duration below it down, which read as the whole block
              // "jumping" on hover.
              className="h-4 w-4 min-w-0 rounded p-0 text-muted-foreground opacity-0 pointer-events-none hover:bg-muted hover:text-accent group-hover:pointer-events-auto group-hover:opacity-100"
            >
              <Pencil className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              disableRipple
              leftIcon={<Trash2 className="h-3 w-3" />}
              onClick={() => onDelete(entry)}
              onPointerDown={(e) => e.stopPropagation()}
              loading={deleting}
              className="h-4 w-4 min-w-0 rounded p-0 text-muted-foreground opacity-0 pointer-events-none hover:bg-muted hover:text-red-400 group-hover:pointer-events-auto group-hover:opacity-100"
            />
          </div>
        )}
      </div>

      <Link
        to={`/projects/${entry.project.id}/tickets/${entry.ticket.id}`}
        className="block truncate text-foreground hover:underline"
        title={entry.note || undefined}
      >
        <span className="text-muted-foreground">{entry.ticket.key}</span> {entry.ticket.title}
      </Link>

      <div className={cn('flex items-center gap-1 text-muted-foreground', (copying || updating) && 'opacity-50')}>
        <span>{formatDuration(entry.minutes)}</span>
        {showActor && <UserChip userId={entry.actorId} className="shrink-0" />}
      </div>

      {canEdit && (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeStart(e);
          }}
          className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize opacity-0 group-hover:opacity-100"
        />
      )}
    </ContextMenu>
  );
};

export default WorklogTimeBlock;
