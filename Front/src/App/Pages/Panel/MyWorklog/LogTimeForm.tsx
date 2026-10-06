import {useState} from 'react';
import {Check} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {DateInput} from '@/components/ui/date-input';
import useLogWorklogHook from '@/lib/Ticket/useLogWorklogHook';
import useUpdateWorklogHook from '@/lib/Ticket/useUpdateWorklogHook';
import {fromDateTimeLocalValue, toDateTimeLocalValue} from '@/lib/Worklog/dateRange';
import TicketPickerInput, {type PickedTicket} from './TicketPickerInput';
import type {MyWorklogEntry} from '@/lib/Worklog/Type/types';

type DurationFields = {hours: string; minutes: string};

const durationToMinutes = ({hours, minutes}: DurationFields): number => (Number(hours) || 0) * 60 + (Number(minutes) || 0);

const minutesToDuration = (totalMinutes: number): DurationFields => ({
  hours: String(Math.floor(totalMinutes / 60)),
  minutes: String(totalMinutes % 60),
});

type LogTimeFormProps = {
  defaultDateTime: string;
  // Prefilled when opened from a drag-selection on WorklogTimeGrid - absent
  // (blank duration) for the plain "+" buttons/MyWorklogWidget. Ignored
  // once editingEntry is set (its own dateTime/minutes win instead).
  defaultDurationMinutes?: number;
  onLogged: () => void;
  // Editing an existing entry (opened via double-click on its block, see
  // WorklogTimeBlock/MyWorklogPage's openEditPopup) instead of logging a new
  // one - its ticket is locked (TicketPickerInput's own disabled) since the
  // update endpoint is scoped by project/ticket/worklog id in the URL, not
  // something the request body can reassign.
  editingEntry?: MyWorklogEntry | null;
};

// Shared by the calendar's per-day "+" action (MyWorklogPage) and the
// dashboard's compact widget (MyWorklogWidget) - the only difference between
// those two call sites is what opens/closes the Popup wrapping this, so that
// stays outside this component. Ticket choice + date + duration + note is
// the same shape TicketWorklogSection's manual-entry form already uses;
// this only adds the ticket picker, since here (unlike a ticket's own
// Worklog tab) there's no ticket in scope yet to log against.
const LogTimeForm = ({defaultDateTime, defaultDurationMinutes, onLogged, editingEntry}: LogTimeFormProps) => {
  const {logWorklog} = useLogWorklogHook();
  const {updateWorklog} = useUpdateWorklogHook();
  const isEditing = !!editingEntry;

  const [ticket, setTicket] = useState<PickedTicket | null>(() =>
    editingEntry
      ? {id: editingEntry.ticket.id, key: editingEntry.ticket.key, title: editingEntry.ticket.title, projectId: editingEntry.project.id}
      : null,
  );
  const [dateTimeLocal, setDateTimeLocal] = useState(() => toDateTimeLocalValue(editingEntry?.dateTime ?? defaultDateTime));
  const [duration, setDuration] = useState<DurationFields>(() => {
    const initialMinutes = editingEntry?.minutes ?? defaultDurationMinutes;
    return initialMinutes ? minutesToDuration(initialMinutes) : {hours: '', minutes: ''};
  });
  const [note, setNote] = useState(editingEntry?.note ?? '');
  const [saving, setSaving] = useState(false);

  const minutes = durationToMinutes(duration);
  const canSubmit = ticket !== null && minutes > 0 && dateTimeLocal !== '';

  const handleSubmit = () => {
    if (!ticket || minutes <= 0) {
      return;
    }

    setSaving(true);

    const payload = {minutes, date: fromDateTimeLocalValue(dateTimeLocal), note};
    const request = editingEntry
      ? updateWorklog(ticket.projectId, ticket.id, editingEntry.id, payload)
      : logWorklog(ticket.projectId, ticket.id, payload);

    request
      .then((result) => {
        if (result.success) {
          onLogged();
        }
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Ticket</span>
        <TicketPickerInput value={ticket} onChange={setTicket} disabled={isEditing} />
      </div>

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
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Note</span>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you work on…" />
      </div>

      <Button size="sm" leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={saving} disabled={!canSubmit} className="self-end">
        {isEditing ? 'Save changes' : 'Log time'}
      </Button>
    </div>
  );
};

export default LogTimeForm;
