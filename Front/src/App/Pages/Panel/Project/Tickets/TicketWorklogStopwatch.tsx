import {memo, useEffect, useRef, useState} from 'react';
import {Play, Square} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Surface} from '@/components/ui/surface';
import {eventBus} from '@/lib/EventBus/EventBus';
import useLogWorklogHook from '@/lib/Ticket/useLogWorklogHook';
import useStartWorklogHook from '@/lib/Ticket/useStartWorklogHook';
import {toLocalDateTimeString} from '@/lib/Worklog/dateRange';
import {WorklogWasStartedRemoteEvent} from '@/lib/WebSocket/Event/WorklogWasStartedRemoteEvent';
import type {Ticket} from '@/lib/Ticket/Type/types';

type TicketWorklogStopwatchProps = {
  projectId: string;
  ticket: Ticket;
  // A patch, not the whole next Ticket - see TicketFieldsSidebar's onChange
  // comment for why.
  onChange: (patch: Partial<Ticket>) => void;
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

// Payload confirmed 2026-08-04: {ticketKey, startedAt, ticketId}.
const extractTicketId = (payload: unknown): string | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const ticketId = (payload as Record<string, unknown>).ticketId;

  return typeof ticketId === 'string' ? ticketId : null;
};

// The sidebar-sized half of Worklog - just the timer. The full logged-entries
// list plus manual entry live in TicketWorklogSection (its own Stepper step)
// instead of here, so this stays a compact widget.
//
// Play/Stop hit their own endpoints, not the ticket PUT (which doesn't
// accept timeEntries) - Play calls .../worklog/start, Stop logs the elapsed
// time through the same .../worklog endpoint manual entries use. Only one
// timer is allowed to run per user at a time: starting work anywhere makes
// the backend broadcast a worklog.started event over the websocket, and if
// *this* ticket's timer is running when that arrives for a *different*
// ticket, it gets auto-committed and stopped instead of silently ticking on
// while another one starts elsewhere.
const TicketWorklogStopwatch = memo(({projectId, ticket, onChange}: TicketWorklogStopwatchProps) => {
  const {logWorklog} = useLogWorklogHook();
  const {startWorklog} = useStartWorklogHook();
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Latest render's values, read from the websocket handler (subscribed once,
  // see below) without resubscribing every second - setInterval ticks
  // elapsedMs, which would otherwise have to be a dependency.
  const latest = useRef({running, startedAt, note, ticket, projectId, onChange, logWorklog});
  latest.current = {running, startedAt, note, ticket, projectId, onChange, logWorklog};

  useEffect(() => {
    if (!running || startedAt === null) {
      return;
    }

    const interval = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(interval);
  }, [running, startedAt]);

  // Optimistic: bumps this ticket's own timeSpent/timeSpentAll by the logged
  // amount right away (matching what the backend does for the ticket itself)
  // rather than waiting on a refetch - ancestors' timeSpentAll also update
  // server-side but aren't loaded here, so they'll just be stale until next
  // fetched.
  //
  // Logs against the actual Play-click instant (startedAtMs), not "now" at
  // commit time - a session that ran 22:50->23:10 belongs at 22:50, so it
  // lands in the right hour on WorklogTimeGrid, not the wrong end of it.
  const commit = (startedAtMs: number, noteAtCommit: string): Promise<void> => {
    const {ticket: currentTicket, projectId: currentProjectId, onChange: currentOnChange, logWorklog: currentLogWorklog} = latest.current;
    const minutes = Math.max(1, Math.round((Date.now() - startedAtMs) / 60_000));
    const date = toLocalDateTimeString(new Date(startedAtMs));

    currentOnChange({
      timeSpent: currentTicket.timeSpent + minutes,
      timeSpentAll: currentTicket.timeSpentAll + minutes,
    });

    return currentLogWorklog(currentProjectId, currentTicket.id, {minutes, date, note: noteAtCommit}).then(() => undefined);
  };

  // Subscribed once (not re-subscribed on every tick/state change) - the
  // handler always reads the latest state through `latest.current`.
  useEffect(() => {
    const handleWorklogStartedRemotely = (event: WorklogWasStartedRemoteEvent) => {
      const remoteTicketId = extractTicketId(event.payload);

      if (remoteTicketId === null || remoteTicketId === latest.current.ticket.id) {
        return;
      }

      if (!latest.current.running || latest.current.startedAt === null) {
        return;
      }

      commit(latest.current.startedAt, latest.current.note);

      setRunning(false);
      setStartedAt(null);
      setElapsedMs(0);
      setNote('');
    };

    eventBus.subscribe<WorklogWasStartedRemoteEvent>(WorklogWasStartedRemoteEvent.name, handleWorklogStartedRemotely);

    return () => {
      eventBus.unsubscribe<WorklogWasStartedRemoteEvent>(WorklogWasStartedRemoteEvent.name, handleWorklogStartedRemotely);
    };
  }, []);

  const handlePlay = () => {
    setStartedAt(Date.now());
    setElapsedMs(0);
    setRunning(true);
    startWorklog(projectId, ticket.id, {startedAt: new Date().toISOString()});
  };

  const handleStop = () => {
    if (startedAt === null) {
      return;
    }

    setSaving(true);
    commit(startedAt, note).finally(() => setSaving(false));

    setRunning(false);
    setStartedAt(null);
    setElapsedMs(0);
    setNote('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Worklog</p>
        <span className="text-sm font-semibold text-accent">
          {Math.floor(ticket.timeSpent / 60)}h {ticket.timeSpent % 60}m
        </span>
      </div>

      <Surface className="flex flex-col gap-2 p-3">
        <span className="text-center font-mono text-2xl tabular-nums text-foreground">{formatElapsed(elapsedMs)}</span>

        {running && (
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What are you working on…" />
        )}

        {running ? (
          <Button size="sm" variant="destructive" leftIcon={<Square className="h-4 w-4" />} onClick={handleStop} loading={saving}>
            Stop
          </Button>
        ) : (
          <Button size="sm" leftIcon={<Play className="h-4 w-4" />} onClick={handlePlay}>
            Start
          </Button>
        )}
      </Surface>
    </div>
  );
});

TicketWorklogStopwatch.displayName = 'TicketWorklogStopwatch';

export default TicketWorklogStopwatch;
