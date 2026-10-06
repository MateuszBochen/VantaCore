import {useEffect, useRef, useState} from 'react';
import useGetTicketHook from '@/lib/Ticket/useGetTicketHook';
import {eventBus} from '@/lib/EventBus/EventBus';
import {TicketWasSavedEvent} from '@/lib/Ticket/Event/TicketWasSavedEvent';
import {TicketWasChangedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasChangedRemoteEvent';
import {TicketWasDeletedRemoteEvent} from '@/lib/WebSocket/Event/TicketWasDeletedRemoteEvent';
import {ticketCache} from '@/lib/Ticket/TicketCache';
import type {Board} from '@/lib/Board/Type/types';
import type {Sprint} from '@/lib/Sprint/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

export type SprintRail = {
  rootTicket: Ticket;
  // One entry per ticketId actually in the sprint that belongs to this
  // hierarchy - `path` is that ticket's ancestor chain, root first, itself
  // last (length 1 if it IS the root). Never the full subtree - only what's
  // actually selected, per the "cała hierarchia dla wybranego tiketu" ask
  // (see memory: project_vantacore_boards_concept).
  selected: {ticket: Ticket; path: Ticket[]}[];
};

// Resolves every ticket in a Sprint into its full Ticket (needed for
// title/key/statusId/parentId) and walks each one up to its root ancestor -
// a Board's rail is always keyed by the root, never by whichever depth was
// actually selected. Sprint.tickets carries each entry's own projectId
// (2026-08-10 - previously just a bare ticketId, forcing the frontend to
// guess a ticket's project by trying every board-linked project until one
// didn't 404), and every ancestor reuses that same project id since tickets
// don't move across projects - no guessing needed anywhere in this file.
const useSprintRail = (board: Board | null, sprint: Sprint | null) => {
  const {getTicket} = useGetTicketHook();
  const [rails, setRails] = useState<SprintRail[] | null>(null);
  // Bumped whenever a ticket is saved elsewhere (e.g. dragging a status
  // slider to a different column) to force the resolution effect below to
  // rerun - useGetTicketHook checks ticketCache first, and useSaveTicketHook
  // updates that same cache on success, so a rerun picks up the fresh
  // statusId without needing to hand-patch every rail/path reference to
  // that ticket (the same object can appear in several places: as a rail's
  // rootTicket, inside other rails' ancestor `path`s, and as its own
  // `selected` entry).
  const [reloadToken, setReloadToken] = useState(0);
  // Tracks which sprint the currently-shown `rails` actually belong to, so
  // the resolution effect below can tell "this is a genuinely different
  // sprint" apart from "same sprint, just re-resolving after a ticket
  // save/websocket change" - only the former should reset `rails` to null
  // (which flashes the board to its "Loading tickets…" state). Resetting on
  // every reloadToken bump too made the WHOLE board flash on every drag-drop
  // status change (bug found 2026-08-06 - noticeable even though the
  // re-resolution itself is fast, since it happened right as the drop
  // landed, still within the user's attention window).
  const resolvedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const handleTicketSaved = () => setReloadToken((token) => token + 1);
    eventBus.subscribe<TicketWasSavedEvent>(TicketWasSavedEvent.name, handleTicketSaved);

    return () => {
      eventBus.unsubscribe<TicketWasSavedEvent>(TicketWasSavedEvent.name, handleTicketSaved);
    };
  }, []);

  // Same idea, but for the websocket's TICKET_CHANGED broadcast - covers a
  // ticket changed by another tab/user (TicketWasSavedEvent above only
  // fires for a save made by THIS tab), and is also the more robust trigger
  // in general: it explicitly invalidates the specific ticket's cache entry
  // first (same as TicketPage's manual "Reload" button), rather than
  // relying on the assumption that whatever just wrote to ticketCache did
  // so correctly - a plain reload-token bump alone would still serve a
  // stale cache hit if that assumption ever didn't hold.
  useEffect(() => {
    const handleTicketChangedRemotely = (remoteEvent: TicketWasChangedRemoteEvent) => {
      if (typeof remoteEvent.payload === 'object' && remoteEvent.payload !== null) {
        const id = (remoteEvent.payload as Record<string, unknown>).id;

        if (typeof id === 'string') {
          ticketCache.delete(id);
        }
      }

      setReloadToken((token) => token + 1);
    };

    eventBus.subscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasChangedRemoteEvent>(TicketWasChangedRemoteEvent.name, handleTicketChangedRemotely);
    };
  }, []);

  // Same idea, for a ticket deleted elsewhere. The backend also drops it
  // from the sprint's own stored ticketIds now (DeleteTicketCommandHandler),
  // but this hook's `sprint` prop is just whatever the parent page already
  // had in state - it won't pick that up until the parent refetches. No
  // separate filtering needed here though: resolveTicket below already
  // treats a failed getTicket (a deleted ticket 404s) as "skip this one",
  // so invalidating the cache and forcing a re-resolution is enough for the
  // rail to quietly drop it on its own.
  useEffect(() => {
    const handleTicketDeletedRemotely = (remoteEvent: TicketWasDeletedRemoteEvent) => {
      if (typeof remoteEvent.payload === 'object' && remoteEvent.payload !== null) {
        const ticketId = (remoteEvent.payload as Record<string, unknown>).ticketId;

        if (typeof ticketId === 'string') {
          ticketCache.delete(ticketId);
        }
      }

      setReloadToken((token) => token + 1);
    };

    eventBus.subscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);

    return () => {
      eventBus.unsubscribe<TicketWasDeletedRemoteEvent>(TicketWasDeletedRemoteEvent.name, handleTicketDeletedRemotely);
    };
  }, []);

  useEffect(() => {
    if (!board || !sprint) {
      return;
    }

    let cancelled = false;

    const key = `${board.id}:${sprint.id}:${sprint.tickets.map((entry) => entry.ticketId).join(',')}`;

    if (resolvedKeyRef.current !== key) {
      setRails(null);
    }

    const ticketsById = new Map<string, Ticket>();

    const resolveTicket = async (ticketId: string, projectId: string): Promise<Ticket | null> => {
      const cached = ticketsById.get(ticketId);

      if (cached) {
        return cached;
      }

      const result = await getTicket(projectId, ticketId);

      if (!result.success) {
        return null;
      }

      ticketsById.set(ticketId, result.ticket);

      return result.ticket;
    };

    const walkToRoot = async (ticket: Ticket, projectId: string): Promise<Ticket[]> => {
      const path = [ticket];
      let current = ticket;

      while (current.parentId) {
        const parent = await resolveTicket(current.parentId, projectId);

        if (!parent) {
          break;
        }

        path.unshift(parent);
        current = parent;
      }

      return path;
    };

    const resolveAll = async () => {
      const railsByRootId = new Map<string, SprintRail>();

      for (const {ticketId, projectId} of sprint.tickets) {
        const ticket = await resolveTicket(ticketId, projectId);

        if (!ticket) {
          continue;
        }

        const path = await walkToRoot(ticket, projectId);
        const rootTicket = path[0];

        const existing = railsByRootId.get(rootTicket.id);

        if (existing) {
          existing.selected.push({ticket, path});
        } else {
          railsByRootId.set(rootTicket.id, {rootTicket, selected: [{ticket, path}]});
        }
      }

      if (!cancelled) {
        resolvedKeyRef.current = key;
        setRails(Array.from(railsByRootId.values()));
      }
    };

    resolveAll();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicket is a thin useRequestHook wrapper recreated every render; ticket ids joined below since arrays aren't referentially stable
  }, [board?.id, sprint?.id, sprint?.tickets.map((entry) => entry.ticketId).join(','), reloadToken]);

  return {rails};
};

export default useSprintRail;
