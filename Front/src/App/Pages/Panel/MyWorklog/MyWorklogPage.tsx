import {useEffect, useMemo, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight, Download, Plus} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {Button} from '@/components/ui/button';
import {PillButton} from '@/components/ui/pill-button';
import {Popup, type PopupHandle} from '@/components/ui/popup';
import {Combobox} from '@/components/ui/combobox';
import {useSetModuleTitle} from '../ModuleTitle';
import {useSetBreadcrumb} from '../Breadcrumb';
import useListMyWorklogHook from '@/lib/Worklog/useListMyWorklogHook';
import useDeleteWorklogHook from '@/lib/Ticket/useDeleteWorklogHook';
import useLogWorklogHook from '@/lib/Ticket/useLogWorklogHook';
import useUpdateWorklogHook from '@/lib/Ticket/useUpdateWorklogHook';
import useUsersHook from '@/lib/User/useUsersHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import JwtManager from '@/lib/Jwt/JwtManager';
import {eventBus} from '@/lib/EventBus/EventBus';
import {WorklogWasChangedRemoteEvent} from '@/lib/WebSocket/Event/WorklogWasChangedRemoteEvent';
import {
  addDays,
  defaultLogDateTime,
  endOfMonth,
  formatDuration,
  formatMonthLabel,
  formatDayLabel,
  localDateOf,
  shiftDateTimeByDays,
  shiftMonth,
  startOfMonth,
  startOfWeek,
  todayIso,
} from '@/lib/Worklog/dateRange';
import MyWorklogDayView from './MyWorklogDayView';
import MyWorklogWeekView from './MyWorklogWeekView';
import MyWorklogMonthView from './MyWorklogMonthView';
import LogTimeForm from './LogTimeForm';
import {exportWorklogPdf} from '@/lib/Worklog/exportWorklogPdf';
import type {MyWorklogEntry} from '@/lib/Worklog/Type/types';

type CalendarView = 'day' | 'week' | 'month';

const VIEWS: {id: CalendarView; label: string}[] = [
  {id: 'day', label: 'Day'},
  {id: 'week', label: 'Week'},
  {id: 'month', label: 'Month'},
];

// Cross-project calendar over the current user's own logged time - reached
// from the sidebar's last top-level entry (see menu.tsx: "My worklog", after
// "My tickets") and from DashboardPage's own compact widget
// (MyWorklogWidget). Backed by GET /api/worklog/mine (confirmed live
// 2026-08-16 - see useListMyWorklogHook's own comment for the full
// contract).
//
// Every worklog entry now carries a real dateTime (start instant), not just
// a date, so Day/Week render an hour-slotted grid (WorklogTimeGrid) with
// entries positioned at their actual time. Month stays a timesheet-style
// bucket-of-entries grid (see MyWorklogMonthView's own comment on why) -
// all three views are still custom-built (no calendar package pulled in),
// following CalendarRangePicker's own hand-built Monday-first grid
// precedent.
const MyWorklogPage = () => {
  const {listMyWorklog} = useListMyWorklogHook();
  const {deleteWorklog} = useDeleteWorklogHook();
  const {logWorklog} = useLogWorklogHook();
  const {updateWorklog} = useUpdateWorklogHook();
  // No GET /api/user/me - same "match the JWT's email against the user
  // directory" convention as UserBadge/ProfilePage.
  const {users} = useUsersHook();
  const email = JwtManager.getInstance().getEmail();
  const me = users.find((user) => user.email === email) ?? null;
  const userName = me ? getUserDisplayName(me) : email || 'My worklog';

  const [view, setView] = useState<CalendarView>('week');
  const [anchor, setAnchor] = useState<string>(todayIso);
  // Tagged by the range it was fetched for (same convention as
  // TicketWorklogSection's FetchState) rather than reset to null on every
  // range change - an effect resetting state synchronously before its own
  // async call is a react-hooks/set-state-in-effect violation.
  const [fetched, setFetched] = useState<{rangeKey: string; entries: MyWorklogEntry[]} | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [logDateTime, setLogDateTime] = useState<string>(() => defaultLogDateTime(todayIso()));
  const [logDurationMinutes, setLogDurationMinutes] = useState<number | undefined>(undefined);
  // Set when the popup was opened via double-click on an existing block
  // (see openEditPopup) instead of the "+"/drag-select flow - LogTimeForm
  // switches into edit mode (ticket locked, PUT instead of POST) whenever
  // this is non-null.
  const [editingEntry, setEditingEntry] = useState<MyWorklogEntry | null>(null);
  // Which users' worklog to show - defaults to just the current user (see
  // the init effect below), same "userIds" filter the backend added to this
  // endpoint. Kept empty until that default is applied, not initialized
  // straight to [me.id] in useState, since `me` isn't resolved yet on the
  // very first render (useUsersHook's directory loads async).
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const initializedUserFilter = useRef(false);

  const popupRef = useRef<PopupHandle>(null);

  useSetModuleTitle('My worklog');
  useSetBreadcrumb([{label: 'My worklog', link: null}]);

  useEffect(() => {
    if (!initializedUserFilter.current && me) {
      setSelectedUserIds([me.id]);
      initializedUserFilter.current = true;
    }
  }, [me]);

  const range = useMemo(() => {
    if (view === 'day') {
      return {start: anchor, end: anchor};
    }

    if (view === 'week') {
      const start = startOfWeek(anchor);
      return {start, end: addDays(start, 6)};
    }

    return {start: startOfMonth(anchor), end: endOfMonth(anchor)};
  }, [view, anchor]);

  const userIdsKey = selectedUserIds.slice().sort().join(',');
  const rangeKey = `${range.start}_${range.end}_${userIdsKey}`;
  const hasUserSelection = selectedUserIds.length > 0;

  // Returns the in-flight promise (not fire-and-forget) - handleMove/
  // handleResize chain onto it so they only clear `updatingId` once the
  // fresh entries have actually landed, not just once the PUT itself
  // resolved (see their own comments on why that ordering matters).
  const refetch = () => {
    if (!hasUserSelection) {
      return Promise.resolve();
    }

    return listMyWorklog(range.start, range.end, selectedUserIds).then((result) => {
      setFetched({rangeKey, entries: result.success ? result.entries : []});
    });
  };

  useEffect(() => {
    if (!hasUserSelection) {
      return;
    }

    let cancelled = false;

    listMyWorklog(range.start, range.end, selectedUserIds).then((result) => {
      if (!cancelled) {
        setFetched({rangeKey, entries: result.success ? result.entries : []});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listMyWorklog is a thin useRequestHook wrapper recreated every render; selectedUserIds is read fresh via userIdsKey/rangeKey (its own array reference isn't stable across renders)
  }, [rangeKey, hasUserSelection]);

  // Latest refetch, read from the websocket handler below without
  // resubscribing on every range/user-filter change - same latestDraftRef
  // convention as TicketEditor's own remote-change handling.
  const latestRefetchRef = useRef(refetch);
  latestRefetchRef.current = refetch;

  // Unlike TicketEditor's staleRemote banner (which deliberately doesn't
  // auto-refetch, to avoid clobbering an in-progress edit), this view has no
  // in-progress edit to protect - it's a read-only calendar plus a popup
  // that owns its own form state - so a plain refetch on every
  // WORKLOG_CHANGED is simplest and safe. Not filtered by the event's own
  // ticketId/actorId/date - a mismatch just means one extra no-op-looking
  // GET, whereas filtering client-side risks missing an entry that should
  // actually show (e.g. a newly selected user, or a date the filter logic
  // got wrong).
  useEffect(() => {
    const handleWorklogChangedRemotely = () => {
      latestRefetchRef.current();
    };

    eventBus.subscribe<WorklogWasChangedRemoteEvent>(WorklogWasChangedRemoteEvent.name, handleWorklogChangedRemotely);

    return () => {
      eventBus.unsubscribe<WorklogWasChangedRemoteEvent>(WorklogWasChangedRemoteEvent.name, handleWorklogChangedRemotely);
    };
  }, []);

  const loading = hasUserSelection && fetched?.rangeKey !== rangeKey;
  // No selection at all (only reachable by clearing every chip) means
  // "nothing to show", not "still loading" - the empty state below tells
  // the difference apart from a genuinely empty result. Memoized (not a
  // bare ternary) so the `[]` empty-selection case doesn't hand
  // entriesByDate's own useMemo a new array identity every render.
  const entries = useMemo(
    () => (!hasUserSelection ? [] : loading ? null : fetched!.entries),
    [hasUserSelection, loading, fetched],
  );

  const entriesByDate = useMemo(() => {
    const grouped: Record<string, MyWorklogEntry[]> = {};
    (entries ?? []).forEach((entry) => {
      (grouped[localDateOf(entry.dateTime)] ??= []).push(entry);
    });
    return grouped;
  }, [entries]);

  const totalMinutes = (entries ?? []).reduce((sum, entry) => sum + entry.minutes, 0);
  // Only shown once the filter actually spans more than one person - the
  // default (just yourself) never needs a chip repeating "you" on every row.
  const showActor = new Set((entries ?? []).map((entry) => entry.actorId)).size > 1;

  const goPrev = () => setAnchor((current) => (view === 'month' ? shiftMonth(current, -1) : addDays(current, view === 'day' ? -1 : -7)));
  const goNext = () => setAnchor((current) => (view === 'month' ? shiftMonth(current, 1) : addDays(current, view === 'day' ? 1 : 7)));
  const goToday = () => setAnchor(todayIso());

  const openLogPopup = (date: string, prefill?: {dateTime: string; durationMinutes: number}) => {
    setEditingEntry(null);
    setLogDateTime(prefill?.dateTime ?? defaultLogDateTime(date));
    setLogDurationMinutes(prefill?.durationMinutes);
    popupRef.current?.open();
  };

  const openEditPopup = (entry: MyWorklogEntry) => {
    setEditingEntry(entry);
    popupRef.current?.open();
  };

  const handleDelete = (entry: MyWorklogEntry) => {
    setDeletingId(entry.id);

    deleteWorklog(entry.project.id, entry.ticket.id, entry.id)
      .then((result) => {
        if (result.success) {
          refetch();
        }
      })
      .finally(() => setDeletingId(null));
  };

  const handleCopy = (entry: MyWorklogEntry, dayShift: 0 | 1) => {
    setCopyingId(entry.id);

    const dateTime = dayShift === 0 ? entry.dateTime : shiftDateTimeByDays(entry.dateTime, 1);

    logWorklog(entry.project.id, entry.ticket.id, {minutes: entry.minutes, date: dateTime, note: entry.note})
      .then((result) => {
        if (result.success) {
          refetch();
        }
      })
      .finally(() => setCopyingId(null));
  };

  // Chains onto refetch()'s own promise (not fire-and-forget) - WorklogTimeGrid
  // keeps showing the dragged block at its dropped position until updatingId
  // clears, so clearing it before the fresh entries have actually landed
  // would flash the block back to its old spot for a moment before jumping
  // to the new one once they arrive (was exactly that double-jump).
  const handleMove = (entry: MyWorklogEntry, newDateTime: string) => {
    setUpdatingId(entry.id);

    updateWorklog(entry.project.id, entry.ticket.id, entry.id, {minutes: entry.minutes, date: newDateTime, note: entry.note})
      .then((result) => (result.success ? refetch() : undefined))
      .finally(() => setUpdatingId(null));
  };

  const handleResize = (entry: MyWorklogEntry, newDurationMinutes: number) => {
    setUpdatingId(entry.id);

    updateWorklog(entry.project.id, entry.ticket.id, entry.id, {minutes: newDurationMinutes, date: entry.dateTime, note: entry.note})
      .then((result) => (result.success ? refetch() : undefined))
      .finally(() => setUpdatingId(null));
  };

  const handleLogged = () => {
    popupRef.current?.close();
    setEditingEntry(null);
    refetch();
  };

  const rangeLabel =
    view === 'day' ? formatDayLabel(anchor) : view === 'week' ? `${formatDayLabel(range.start)} – ${formatDayLabel(range.end)}` : formatMonthLabel(anchor);

  const resolveUserName = (userId: string): string => {
    const user = users.find((candidate) => candidate.id === userId);
    return user ? getUserDisplayName(user) : userId;
  };

  const handleExport = () => {
    if (entries && entries.length > 0) {
      exportWorklogPdf(entries, rangeLabel, userName, resolveUserName);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">My worklog</p>


        <div className="flex flex-col gap-0.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-widest text-accent/70">Logged this {view}</span>
          <span className="text-lg font-semibold leading-none text-accent">{formatDuration(totalMinutes)}</span>
        </div>

      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Users</span>
        <Combobox
          multiple
          value={selectedUserIds}
          onValueChange={setSelectedUserIds}
          placeholder="Select users…"
          options={users.map((user) => ({value: user.id, label: getUserDisplayName(user), avatarUrl: user.avatarUrl}))}
          className="max-w-md"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {VIEWS.map(({id, label}) => (
            <PillButton key={id} selected={view === id} onClick={() => setView(id)}>
              {label}
            </PillButton>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disableRipple onClick={goPrev} className="h-8 w-8 min-w-0 rounded-md">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={goToday}>
            Today
          </Button>

          <Button variant="ghost" size="icon" disableRipple onClick={goNext} className="h-8 w-8 min-w-0 rounded-md">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <p className="ml-2 min-w-40 text-sm font-medium text-foreground">{rangeLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExport}
            disabled={!entries || entries.length === 0}
          >
            Export to PDF
          </Button>

          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => openLogPopup(view === 'day' ? anchor : todayIso())}>
            Log time
          </Button>
        </div>
      </div>

      {!hasUserSelection && <p className="text-sm text-muted-foreground">Select at least one user to see their worklog.</p>}

      {hasUserSelection && (view === 'day' || view === 'week') && (
        <div className="min-h-0 flex-1 overflow-hidden">
          {view === 'day' ? (
            <MyWorklogDayView
              date={anchor}
              entries={entries === null ? null : (entriesByDate[anchor] ?? [])}
              deletingId={deletingId}
              onDelete={handleDelete}
              onLogClick={openLogPopup}
              onCopy={handleCopy}
              copyingId={copyingId}
              onMove={handleMove}
              onResize={handleResize}
              updatingId={updatingId}
              onEdit={openEditPopup}
              showActor={showActor}
              currentUserId={me?.id ?? null}
            />
          ) : (
            <MyWorklogWeekView
              weekStart={range.start}
              entriesByDate={entriesByDate}
              loading={entries === null}
              deletingId={deletingId}
              onDelete={handleDelete}
              onDayClick={(date) => {
                setAnchor(date);
                setView('day');
              }}
              onLogClick={openLogPopup}
              onCopy={handleCopy}
              copyingId={copyingId}
              onMove={handleMove}
              onResize={handleResize}
              updatingId={updatingId}
              onEdit={openEditPopup}
              currentUserId={me?.id ?? null}
            />
          )}
        </div>
      )}

      {hasUserSelection && view === 'month' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <MyWorklogMonthView
            monthAnchor={anchor}
            entriesByDate={entriesByDate}
            onDayClick={(date) => {
              setAnchor(date);
              setView('day');
            }}
            onLogClick={openLogPopup}
          />
        </div>
      )}

      <Popup ref={popupRef} title={editingEntry ? 'Edit time entry' : 'Log time'} initialSize={{width: 420, height: 420}} bodyClassName="overflow-visible">
        {/* Keyed so switching targets while the popup's already open (it's a
            non-modal floating window, see Popup's own comment) remounts the
            form instead of leaving LogTimeForm's internal state - ticket/
            date/duration/note - initialized from whichever entry was being
            edited before. */}
        <LogTimeForm
          key={editingEntry?.id ?? 'new'}
          defaultDateTime={logDateTime}
          defaultDurationMinutes={logDurationMinutes}
          onLogged={handleLogged}
          editingEntry={editingEntry}
        />
      </Popup>
    </PageContainer>
  );
};

export default MyWorklogPage;
