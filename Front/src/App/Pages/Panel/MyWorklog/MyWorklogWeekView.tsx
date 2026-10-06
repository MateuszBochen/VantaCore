import {addDays} from '@/lib/Worklog/dateRange';
import WorklogTimeGrid from './WorklogTimeGrid';
import type {MyWorklogEntry} from '@/lib/Worklog/Type/types';

type MyWorklogWeekViewProps = {
  weekStart: string;
  entriesByDate: Record<string, MyWorklogEntry[]>;
  loading: boolean;
  deletingId: string | null;
  onDelete: (entry: MyWorklogEntry) => void;
  onDayClick: (date: string) => void;
  onLogClick: (date: string, prefill?: {dateTime: string; durationMinutes: number}) => void;
  onCopy: (entry: MyWorklogEntry, dayShift: 0 | 1) => void;
  copyingId: string | null;
  onMove: (entry: MyWorklogEntry, newDateTime: string) => void;
  onResize: (entry: MyWorklogEntry, newDurationMinutes: number) => void;
  updatingId: string | null;
  onEdit: (entry: MyWorklogEntry) => void;
  currentUserId: string | null;
};

// No actor chip here even when the user filter has more than one person
// selected - a 7-column grid is too narrow for it (unlike MyWorklogDayView).
// Drilling into a day (onDayClick) is how you'd tell whose entry is whose.
const MyWorklogWeekView = ({
  weekStart,
  entriesByDate,
  loading,
  deletingId,
  onDelete,
  onDayClick,
  onLogClick,
  onCopy,
  copyingId,
  onMove,
  onResize,
  updatingId,
  onEdit,
  currentUserId,
}: MyWorklogWeekViewProps) => {
  const days = Array.from({length: 7}, (_, i) => addDays(weekStart, i));

  return (
    <WorklogTimeGrid
      days={days}
      entriesByDate={entriesByDate}
      loading={loading}
      deletingId={deletingId}
      onDelete={onDelete}
      onLogClick={onLogClick}
      onRangeSelect={(date, dateTime, durationMinutes) => onLogClick(date, {dateTime, durationMinutes})}
      onCopy={onCopy}
      copyingId={copyingId}
      onMove={onMove}
      onResize={onResize}
      updatingId={updatingId}
      onEdit={onEdit}
      showActor={false}
      currentUserId={currentUserId}
      showColumnHeaders
      onDayHeaderClick={onDayClick}
    />
  );
};

export default MyWorklogWeekView;
