import {useCallback, useEffect, useRef, useState} from 'react';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import useGetTicketsHook from '@/lib/Ticket/useGetTicketsHook';
import {eventBus} from '@/lib/EventBus/EventBus';
import {TicketWasSavedEvent} from '@/lib/Ticket/Event/TicketWasSavedEvent';
import {PRIORITIES} from '@/lib/Ticket/Type/types';
import type {IssueType, Status} from '@/lib/Project/Type/types';
import type {Ticket, TicketSummary} from '@/lib/Ticket/Type/types';
import TicketPopup, {type TicketPopupHandle} from './TicketPopup';

type TicketChildrenStepProps = {
  projectId: string;
  ticket: Ticket;
  issueTypes: IssueType[];
  statuses: Status[];
};

// Full-width "Children" Stepper step - a roomier, popup-driven counterpart
// to TicketSidebar's own compact Children face (TicketChildrenSection,
// deliberately left untouched: same data, different context). "Add child"
// here opens a popup instead of navigating to .../tickets/new?parentId=...
// - that full-page round trip was the actual complaint (losing the ticket
// you were just looking at to go add one more). Flat, one level only -
// unlike TicketRow this doesn't recurse into grandchildren; that's still
// available via the child's own Children step once opened.
const TicketChildrenStep = ({projectId, ticket, issueTypes, statuses}: TicketChildrenStepProps) => {
  const {getTickets} = useGetTicketsHook();
  const [children, setChildren] = useState<TicketSummary[] | null>(null);
  const popupRef = useRef<TicketPopupHandle>(null);

  const issueType = issueTypes.find((type) => type.id === ticket.issueTypeId) ?? null;
  const canHaveChildren = !!issueType && issueType.childTypeIds.length > 0;

  const refetch = useCallback(() => {
    getTickets(projectId, ticket.id).then((result) => {
      if (result.success) {
        setChildren(result.tickets);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTickets is a thin useRequestHook wrapper recreated every render
  }, [projectId, ticket.id]);

  useEffect(() => {
    let cancelled = false;

    getTickets(projectId, ticket.id).then((result) => {
      if (!cancelled && result.success) {
        setChildren(result.tickets);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTickets is a thin useRequestHook wrapper recreated every render
  }, [projectId, ticket.id]);

  // Covers both "a new child was just created" and "an existing child was
  // edited" from the popup below - TicketWasSavedEvent fires on every
  // successful save (see useSaveTicketHook), no id filtering needed since
  // this is just a cheap refetch of this one level.
  useEffect(() => {
    eventBus.subscribe<TicketWasSavedEvent>(TicketWasSavedEvent.name, refetch);
    return () => eventBus.unsubscribe<TicketWasSavedEvent>(TicketWasSavedEvent.name, refetch);
  }, [refetch]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Children {children ? `(${children.length})` : ''}</p>

        {canHaveChildren && (
          <Button size="sm" onClick={() => popupRef.current?.openNew(projectId, ticket.id)}>
            <Plus className="h-4 w-4" />
            Add child
          </Button>
        )}
      </div>

      {children === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : children.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sub-tickets.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {children.map((child) => {
            const childIssueType = issueTypes.find((type) => type.id === child.issueTypeId) ?? null;
            const status = statuses.find((candidate) => candidate.id === child.statusId) ?? null;
            const priority = PRIORITIES.find((candidate) => candidate.level === child.priority) ?? null;

            return (
              <button
                key={child.id}
                type="button"
                onClick={() => popupRef.current?.open(projectId, child.id, child.key)}
                className="flex items-center gap-3 rounded-xl border border-border bg-white/[0.03] p-3 text-left hover:bg-card"
              >
                {priority && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{backgroundColor: priority.color}}
                    title={`Priority: ${priority.name}`}
                  />
                )}

                <span className="shrink-0 text-xs text-muted-foreground">{child.key}</span>

                {childIssueType && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{backgroundColor: `${childIssueType.color}33`, color: childIssueType.color}}
                  >
                    {childIssueType.name}
                  </span>
                )}

                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{child.title}</span>

                {status && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{backgroundColor: `${status.color}33`, color: status.color}}
                  >
                    {status.name}
                  </span>
                )}

                <span className="shrink-0 text-xs text-muted-foreground" title="Total time logged">
                  {Math.floor(child.timeSpentAll / 60)}h {child.timeSpentAll % 60}m
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Distinct storageKey from the "parent" TicketPopup this step itself
          might be rendering inside of (opening a ticket in a popup, then
          using ITS Children step to open one more) - otherwise both would
          default to the exact same remembered position/size and open
          perfectly stacked on top of each other. */}
      <TicketPopup ref={popupRef} storageKey="ticket-children-popup" />
    </div>
  );
};

export default TicketChildrenStep;
