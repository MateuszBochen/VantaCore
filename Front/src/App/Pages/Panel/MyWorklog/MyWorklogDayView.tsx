import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {formatDayLabel, formatDuration} from '@/lib/Worklog/dateRange';
import WorklogTimeGrid from './WorklogTimeGrid';
import type {MyWorklogEntry} from '@/lib/Worklog/Type/types';

type MyWorklogDayViewProps = {
  date: string;
  entries: MyWorklogEntry[] | null;
  deletingId: string | null;
  onDelete: (entry: MyWorklogEntry) => void;
  onLogClick: (date: string, prefill?: {dateTime: string; durationMinutes: number}) => void;
  onCopy: (entry: MyWorklogEntry, dayShift: 0 | 1) => void;
  copyingId: string | null;
  onMove: (entry: MyWorklogEntry, newDateTime: string) => void;
  onResize: (entry: MyWorklogEntry, newDurationMinutes: number) => void;
  updatingId: string | null;
  onEdit: (entry: MyWorklogEntry) => void;
  showActor: boolean;
  currentUserId: string | null;
};

const MyWorklogDayView = ({
  date,
  entries,
  deletingId,
  onDelete,
  onLogClick,
  onCopy,
  copyingId,
  onMove,
  onResize,
  updatingId,
  onEdit,
  showActor,
  currentUserId,
}: MyWorklogDayViewProps) => {
  const total = (entries ?? []).reduce((sum, entry) => sum + entry.minutes, 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-semibold text-foreground">{formatDayLabel(date)}</p>
          {entries !== null && entries.length > 0 && <span className="text-xs text-accent">{formatDuration(total)}</span>}
        </div>

        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => onLogClick(date)}>
          Log time
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <WorklogTimeGrid
          days={[date]}
          entriesByDate={{[date]: entries ?? []}}
          loading={entries === null}
          deletingId={deletingId}
          onDelete={onDelete}
          onLogClick={onLogClick}
          onRangeSelect={(rangeDate, dateTime, durationMinutes) => onLogClick(rangeDate, {dateTime, durationMinutes})}
          onCopy={onCopy}
          copyingId={copyingId}
          onMove={onMove}
          onResize={onResize}
          updatingId={updatingId}
          onEdit={onEdit}
          showActor={showActor}
          currentUserId={currentUserId}
          showColumnHeaders={false}
        />
      </div>
    </div>
  );
};

export default MyWorklogDayView;
