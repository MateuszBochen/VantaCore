import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Check} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {useNavigate, useParams} from 'react-router-dom';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {CalendarRangePicker} from '@/components/ui/calendar-range-picker';
import {useSetModuleTitle} from '../ModuleTitle';
import useGetBoardHook from '@/lib/Board/useGetBoardHook';
import useSaveSprintHook from '@/lib/Sprint/useSaveSprintHook';
import useListSprintsHook from '@/lib/Sprint/useListSprintsHook';
import useGetProjectHook from '@/lib/Project/useGetProjectHook';
import useGetTicketHook from '@/lib/Ticket/useGetTicketHook';
import toTicketSummary from '@/lib/Ticket/toTicketSummary';
import applyTicketChangedPayload from '@/lib/Ticket/applyTicketChangedPayload';
import {eventBus} from '@/lib/EventBus/EventBus';
import {TicketWasChangedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasChangedRemoteEvent';
import createDraftSprint from './createDraftSprint';
import SprintDateRangeSection from './SprintDateRangeSection';
import SprintTicketPicker from './SprintTicketPicker';
import SprintSelectedTickets from './SprintSelectedTickets';
import TicketPopup, {type TicketPopupHandle} from '../Project/Tickets/TicketPopup';
import type {Sprint, SprintTicketRef} from '@/lib/Sprint/Type/types';
import type {Board} from '@/lib/Board/Type/types';
import type {Project} from '@/lib/Project/Type/types';
import type {TicketSummary} from '@/lib/Ticket/Type/types';

const addUniqueRefs = (current: SprintTicketRef[], added: SprintTicketRef[]): SprintTicketRef[] => {
  const known = new Set(current.map((ref) => ref.ticketId));
  return [...current, ...added.filter((ref) => !known.has(ref.ticketId))];
};

// Handles both .../sprints/new (create) and .../sprints/:sprintId/edit
// (edit, only reachable from BoardPage for 'future' sprints - starting an
// active sprint locks it in, see memory: project_vantacore_boards_concept).
// There's no GET-single-sprint endpoint, so edit mode fetches the board's
// sprint list and filters client-side - same list BoardPage already needed
// anyway. The full list is fetched even for create, since it also feeds the
// date-range calendar's "other sprints on this board" busy markers, and to
// find the previous sprint whose unfinished tickets get carried over.
const SprintFormPage = () => {
  const {boardId, sprintId} = useParams<{boardId: string; sprintId?: string}>();
  const isEdit = Boolean(sprintId);
  const navigate = useNavigate();
  const {getBoard} = useGetBoardHook();
  const {listSprints} = useListSprintsHook();
  const {saveSprint} = useSaveSprintHook();
  const [board, setBoard] = useState<Board | null>(null);
  const [allSprints, setAllSprints] = useState<Sprint[] | null>(null);
  const [draft, setDraft] = useState<Sprint | null>(null);
  const [draftForId, setDraftForId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {getProject} = useGetProjectHook();
  const {getTicket} = useGetTicketHook();
  // The board's projects (statuses/estimate units) - shared by the picker
  // and the selected-tickets panel. null while loading.
  const [projects, setProjects] = useState<Project[] | null>(null);
  // Every ticket either the picker or the selected-tickets panel has loaded,
  // by id - the panel lists/sums the selected ones from here.
  const [knownTickets, setKnownTickets] = useState<Record<string, TicketSummary>>({});
  // The previous sprint's tickets that aren't done yet, once looked up.
  const [carryOverRefs, setCarryOverRefs] = useState<SprintTicketRef[]>([]);
  const [carriedOverIds, setCarriedOverIds] = useState<Set<string>>(new Set());
  // Which previous sprint was already auto-carried into a NEW sprint's
  // draft - so it happens once, not again after the user removed some.
  const autoCarriedFrom = useRef<string | null>(null);
  const ticketPopupRef = useRef<TicketPopupHandle>(null);
  // The selected-tickets panel is pinned to the calendar's height (not its
  // own content's) so a long ticket list scrolls inside it instead of
  // growing the whole row - measured live, since the calendar's height
  // changes with the month (5 vs 6 week rows) and when the row wraps.
  const [calendarElement, setCalendarElement] = useState<HTMLDivElement | null>(null);
  const [calendarHeight, setCalendarHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!calendarElement) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => setCalendarHeight(entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height));
    observer.observe(calendarElement);

    return () => observer.disconnect();
  }, [calendarElement]);

  const rememberTickets = useCallback((tickets: TicketSummary[]) => {
    if (tickets.length === 0) {
      return;
    }

    setKnownTickets((current) => {
      const next = {...current};
      tickets.forEach((ticket) => {
        next[ticket.id] = ticket;
      });
      return next;
    });
  }, []);

  const handleOpenTicket = useCallback((ticket: TicketSummary) => ticketPopupRef.current?.open(ticket.projectId, ticket.id, ticket.key), []);

  useSetModuleTitle(isEdit ? 'Edit sprint' : 'New sprint');

  useEffect(() => {
    if (!boardId) {
      return;
    }

    let cancelled = false;

    getBoard(boardId).then((result) => {
      if (!cancelled && result.success) {
        setBoard(result.board);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getBoard is a thin useRequestHook wrapper recreated every render
  }, [boardId]);

  useEffect(() => {
    if (!boardId) {
      return;
    }

    let cancelled = false;

    listSprints(boardId).then((result) => {
      if (!cancelled && result.success) {
        setAllSprints(result.sprints);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listSprints is a thin useRequestHook wrapper recreated every render
  }, [boardId]);

  const boardProjectsKey = board?.projectIds.join(',') ?? '';

  useEffect(() => {
    if (!boardProjectsKey) {
      return;
    }

    let cancelled = false;

    Promise.all(boardProjectsKey.split(',').map((id) => getProject(id))).then((results) => {
      if (!cancelled) {
        setProjects(results.flatMap((result) => (result.success ? [result.project] : [])));
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getProject is a thin useRequestHook wrapper recreated every render; the joined id list is the real dependency
  }, [boardProjectsKey]);

  // Keeps the shared ticket pool (statuses, estimates in the selected list)
  // live when a ticket is edited - e.g. from the TicketPopup below.
  useEffect(() => {
    const handleTicketChangedRemotely = (remoteEvent: TicketWasChangedRemoteEvent) => {
      setKnownTickets((current) => {
        const patched = applyTicketChangedPayload(Object.values(current), remoteEvent.payload);
        return Object.fromEntries(patched.map((ticket) => [ticket.id, ticket]));
      });
    };

    eventBus.subscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);
    };
  }, []);

  const fetchedSprint = isEdit ? (allSprints?.find((sprint) => sprint.id === sprintId) ?? null) : null;

  // Derived-during-render reset (not an effect) - same pattern as
  // BoardSettingsPage/TicketPage: creation starts a fresh local draft, an
  // existing sprint's draft is replaced wholesale when the fetched sprint is
  // actually a different one, local edits otherwise survive re-renders.
  if (!isEdit && boardId && draftForId !== 'new') {
    setDraftForId('new');
    setDraft(createDraftSprint(boardId));
  }

  if (isEdit && fetchedSprint && sprintId !== draftForId) {
    setDraftForId(sprintId ?? null);
    setDraft(fetchedSprint);
  }

  // "Previous" = the most recently started sprint on this board (active or
  // closed - a future one hasn't happened yet) that started before this
  // one; without a start date yet, simply the most recently started.
  const draftId = draft?.id;
  const draftStartDate = draft?.startDate;
  const previousSprint = useMemo(
    () =>
      (allSprints ?? [])
        .filter((sprint) => sprint.id !== draftId && sprint.status !== 'future' && (!draftStartDate || sprint.startDate < draftStartDate))
        .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null,
    [allSprints, draftId, draftStartDate],
  );

  // Looks up the previous sprint's tickets and keeps the ones whose status
  // isn't a done one. A NEW sprint gets them added automatically (once); on
  // edit they're only offered (SprintSelectedTickets' "Add N unfinished"
  // button) - re-adding them every time the form opens would bring back
  // tickets the user deliberately removed.
  useEffect(() => {
    if (!previousSprint || !projects) {
      return;
    }

    let cancelled = false;
    const previous = previousSprint;

    Promise.all(previous.tickets.map((ref) => getTicket(ref.projectId, ref.ticketId))).then((results) => {
      if (cancelled) {
        return;
      }

      const loaded = results.flatMap((result) => (result.success ? [toTicketSummary(result.ticket)] : []));
      rememberTickets(loaded);

      const unfinished = loaded
        .filter((ticket) => {
          const status = projects.find((project) => project.id === ticket.projectId)?.statuses.find((candidate) => candidate.id === ticket.statusId);
          return status !== undefined && !status.isDone;
        })
        .map((ticket) => ({ticketId: ticket.id, projectId: ticket.projectId}));

      setCarryOverRefs(unfinished);

      if (!isEdit && autoCarriedFrom.current !== previous.id) {
        autoCarriedFrom.current = previous.id;
        setDraft((current) => (current ? {...current, tickets: addUniqueRefs(current.tickets, unfinished)} : current));
        setCarriedOverIds(new Set(unfinished.map((ref) => ref.ticketId)));
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicket/rememberTickets are stable enough; re-run only when the previous sprint or project catalog changes
  }, [previousSprint?.id, projects]);

  const handleSubmit = useCallback(() => {
    if (!draft || !boardId) {
      return;
    }

    setSaving(true);

    saveSprint(draft)
      .then((result) => {
        if (result.success) {
          navigate(`/sprints/${boardId}`, {replace: true});
        }
      })
      .finally(() => setSaving(false));
  }, [draft, boardId, saveSprint, navigate]);

  if (isEdit && allSprints && !fetchedSprint) {
    return <p className="p-8 text-sm text-muted-foreground">Sprint not found.</p>;
  }

  if (!board || !draft) {
    return <p className="p-8 text-sm text-muted-foreground">{isEdit ? 'Loading sprint…' : 'Loading board…'}</p>;
  }

  const selectedIds = new Set(draft.tickets.map((ref) => ref.ticketId));
  const pendingCarryOver = carryOverRefs.filter((ref) => !selectedIds.has(ref.ticketId));

  const handleAddCarryOver = () => {
    setDraft({...draft, tickets: addUniqueRefs(draft.tickets, pendingCarryOver)});
    setCarriedOverIds((current) => new Set([...current, ...pendingCarryOver.map((ref) => ref.ticketId)]));
  };

  const occupied = (allSprints ?? [])
    .filter((sprint) => sprint.id !== draft.id)
    .map((sprint) => ({startDate: sprint.startDate, endDate: sprint.endDate, label: sprint.name}));

  return (
    <PageContainer>
      <p className="text-sm font-semibold text-foreground">
        {isEdit ? 'Edit sprint' : 'New sprint'} — {board.name}
      </p>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex w-full max-w-md flex-1 flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Sprint name</label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({...draft, name: e.target.value})}
                placeholder="e.g. Sprint 12"
              />
            </div>

            <SprintDateRangeSection
              startDate={draft.startDate}
              endDate={draft.endDate}
              onChange={({startDate, endDate}) => setDraft({...draft, startDate, endDate})}
            />
          </div>

          <div ref={setCalendarElement} className="w-full max-w-sm flex-1">
            <CalendarRangePicker
              startDate={draft.startDate}
              endDate={draft.endDate}
              onChange={({startDate, endDate}) => setDraft({...draft, startDate, endDate})}
              occupied={occupied}
              className="w-full"
            />
          </div>

          <SprintSelectedTickets
            height={calendarHeight}
            tickets={draft.tickets}
            knownTickets={knownTickets}
            onTicketsLoaded={rememberTickets}
            projects={projects ?? []}
            onRemove={(ticketId) => setDraft({...draft, tickets: draft.tickets.filter((ref) => ref.ticketId !== ticketId)})}
            onOpenTicket={handleOpenTicket}
            carriedOverIds={carriedOverIds}
            carryOver={
              previousSprint && pendingCarryOver.length > 0
                ? {sprintName: previousSprint.name, count: pendingCarryOver.length, onAdd: handleAddCarryOver}
                : null
            }
          />
        </div>

        <SprintTicketPicker
          projectIds={board.projectIds}
          projects={projects}
          tickets={draft.tickets}
          onChange={(tickets) => setDraft({...draft, tickets})}
          onTicketsLoaded={rememberTickets}
          onOpenTicket={handleOpenTicket}
        />
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={saving} disabled={!draft.name.trim()}>
          Submit
        </Button>
      </div>

      <TicketPopup ref={ticketPopupRef} storageKey="sprint-picker-ticket-popup" />
    </PageContainer>
  );
};

export default SprintFormPage;
