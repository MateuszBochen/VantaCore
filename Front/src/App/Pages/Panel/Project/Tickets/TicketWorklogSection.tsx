import {useEffect, useState} from 'react';
import {Check, Pencil, Plus, Trash2} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {DateInput} from '@/components/ui/date-input';
import {UserChip} from '@/components/ui/user-chip';
import {Surface} from '@/components/ui/surface';
import useListWorklogHook from '@/lib/Ticket/useListWorklogHook';
import useLogWorklogHook from '@/lib/Ticket/useLogWorklogHook';
import useUpdateWorklogHook from '@/lib/Ticket/useUpdateWorklogHook';
import useDeleteWorklogHook from '@/lib/Ticket/useDeleteWorklogHook';
import {formatDateTimeLabel, fromDateTimeLocalValue, toDateTimeLocalValue} from '@/lib/Worklog/dateRange';
import type {WorklogEntry, Ticket} from '@/lib/Ticket/Type/types';

type TicketWorklogSectionProps = {
  projectId: string;
  ticket: Ticket;
  onChange: (ticket: Ticket) => void;
};

// Tagged by the ticket it was fetched for, same convention as
// TicketPage/useProjectFromRoute - lets this component tell "still loading
// for the current ticket" apart from "loaded, just empty".
type FetchState = {
  id: string;
  entries: WorklogEntry[];
};

type DurationFields = {hours: string; minutes: string};

const durationToMinutes = ({hours, minutes}: DurationFields): number => (Number(hours) || 0) * 60 + (Number(minutes) || 0);

const minutesToDuration = (totalMinutes: number): DurationFields => ({
  hours: String(Math.floor(totalMinutes / 60)),
  minutes: String(totalMinutes % 60),
});

// The full logged-entries list - its own Stepper step (see TicketPage),
// fetched lazily from its own endpoint rather than embedded on Ticket (same
// precedent as Comments/SubProject docs), so it doesn't push the sidebar's
// stopwatch (TicketWorklogStopwatch) down every time a new entry gets
// logged. Also covers manual entry, editing and deleting - not every session
// starts with the stopwatch's Play button, and mistakes happen.
//
// ticket.timeSpent/timeSpentAll are rollups the backend maintains (this
// ticket's own logged time, and this ticket + every descendant's) - every
// add/edit/delete here nudges them optimistically by the same amount the
// backend applies (edits by the old/new difference), rather than waiting on
// a full ticket refetch to see the new totals.
const TicketWorklogSection = ({projectId, ticket, onChange}: TicketWorklogSectionProps) => {
  const {listWorklog} = useListWorklogHook();
  const {logWorklog} = useLogWorklogHook();
  const {updateWorklog} = useUpdateWorklogHook();
  const {deleteWorklog} = useDeleteWorklogHook();

  const [fetched, setFetched] = useState<FetchState | null>(null);

  const [dateTimeLocal, setDateTimeLocal] = useState(() => toDateTimeLocalValue(new Date().toISOString()));
  const [duration, setDuration] = useState<DurationFields>({hours: '', minutes: ''});
  const [note, setNote] = useState('');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDateTimeLocal, setEditDateTimeLocal] = useState('');
  const [editDuration, setEditDuration] = useState<DurationFields>({hours: '', minutes: ''});
  const [editNote, setEditNote] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refetch = () => {
    listWorklog(projectId, ticket.id).then((result) => {
      setFetched({id: ticket.id, entries: result.success ? result.entries : []});
    });
  };

  useEffect(() => {
    let cancelled = false;

    listWorklog(projectId, ticket.id).then((result) => {
      if (!cancelled) {
        setFetched({id: ticket.id, entries: result.success ? result.entries : []});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listWorklog is a thin useRequestHook wrapper recreated every render
  }, [projectId, ticket.id]);

  const loading = fetched?.id !== ticket.id;
  const entries = loading ? [] : fetched!.entries;
  const enteredMinutes = durationToMinutes(duration);

  const handleAdd = () => {
    if (enteredMinutes <= 0) {
      return;
    }

    setAdding(true);

    logWorklog(projectId, ticket.id, {minutes: enteredMinutes, date: fromDateTimeLocalValue(dateTimeLocal), note})
      .then((result) => {
        if (result.success) {
          onChange({...ticket, timeSpent: ticket.timeSpent + enteredMinutes, timeSpentAll: ticket.timeSpentAll + enteredMinutes});
          setDuration({hours: '', minutes: ''});
          setNote('');
          refetch();
        }
      })
      .finally(() => setAdding(false));
  };

  const startEdit = (entry: WorklogEntry) => {
    setEditingId(entry.id);
    setEditDateTimeLocal(toDateTimeLocalValue(entry.dateTime));
    setEditDuration(minutesToDuration(entry.minutes));
    setEditNote(entry.note);
  };

  const handleSaveEdit = (entry: WorklogEntry) => {
    const newMinutes = durationToMinutes(editDuration);

    if (newMinutes <= 0) {
      return;
    }

    setEditSaving(true);

    updateWorklog(projectId, ticket.id, entry.id, {minutes: newMinutes, date: fromDateTimeLocalValue(editDateTimeLocal), note: editNote})
      .then((result) => {
        if (result.success) {
          const diff = newMinutes - entry.minutes;
          onChange({...ticket, timeSpent: ticket.timeSpent + diff, timeSpentAll: ticket.timeSpentAll + diff});
          setEditingId(null);
          refetch();
        }
      })
      .finally(() => setEditSaving(false));
  };

  const handleDelete = (entry: WorklogEntry) => {
    setDeletingId(entry.id);

    deleteWorklog(projectId, ticket.id, entry.id)
      .then((result) => {
        if (result.success) {
          onChange({...ticket, timeSpent: ticket.timeSpent - entry.minutes, timeSpentAll: ticket.timeSpentAll - entry.minutes});
          refetch();
        }
      })
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Worklog</p>

        <div className="flex flex-wrap gap-2">
          <div className="flex flex-col gap-0.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5">
            <span className="text-[10px] uppercase tracking-widest text-accent/70">Logged</span>
            <span className="text-lg font-semibold leading-none text-accent">
              {Math.floor(ticket.timeSpent / 60)}h {ticket.timeSpent % 60}m
            </span>
          </div>

          {ticket.timeSpentAll !== ticket.timeSpent && (
            <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card px-3 py-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">With sub-tickets</span>
              <span className="text-lg font-semibold leading-none text-foreground">
                {Math.floor(ticket.timeSpentAll / 60)}h {ticket.timeSpentAll % 60}m
              </span>
            </div>
          )}
        </div>
      </div>

      <Surface className="flex flex-col gap-2 p-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Log time manually</p>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Date &amp; time</span>
            <DateInput value={dateTimeLocal} onChange={setDateTimeLocal} type="datetime-local" className="w-48" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Hours</span>
            <Input
              type="number"
              min={0}
              value={duration.hours}
              onChange={(e) => setDuration({...duration, hours: e.target.value})}
              placeholder="0"
              className="w-16"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Minutes</span>
            <Input
              type="number"
              min={0}
              max={59}
              value={duration.minutes}
              onChange={(e) => setDuration({...duration, minutes: e.target.value})}
              placeholder="0"
              className="w-16"
            />
          </div>

          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you work on…" className="min-w-40 flex-1" />

          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd} loading={adding} disabled={enteredMinutes <= 0}>
            Add
          </Button>
        </div>
      </Surface>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading worklog…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No time logged yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) =>
            editingId === entry.id ? (
              <Surface key={entry.id} accent className="flex flex-col gap-2 px-3 py-2">
                <div className="flex flex-wrap items-end gap-2">
                  <DateInput value={editDateTimeLocal} onChange={setEditDateTimeLocal} type="datetime-local" className="w-48" />
                  <Input
                    type="number"
                    min={0}
                    value={editDuration.hours}
                    onChange={(e) => setEditDuration({...editDuration, hours: e.target.value})}
                    className="w-14"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={editDuration.minutes}
                    onChange={(e) => setEditDuration({...editDuration, minutes: e.target.value})}
                    className="w-14"
                  />
                  <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} className="min-w-32 flex-1" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" leftIcon={<Check className="h-4 w-4" />} onClick={() => handleSaveEdit(entry)} loading={editSaving}>
                    Save
                  </Button>
                </div>
              </Surface>
            ) : (
              <Surface key={entry.id} className="flex flex-col gap-1 px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 font-medium text-foreground">
                    {Math.floor(entry.minutes / 60)}h {entry.minutes % 60}m
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTimeLabel(entry.dateTime)}</span>
                  <UserChip userId={entry.actorId} />
                  <span className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    disableRipple
                    onClick={() => startEdit(entry)}
                    className="h-6 w-6 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disableRipple
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => handleDelete(entry)}
                    loading={deletingId === entry.id}
                    className="h-6 w-6 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-red-400"
                  />
                </div>
                {entry.note && <p className="truncate text-xs text-muted-foreground">{entry.note}</p>}
              </Surface>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default TicketWorklogSection;
