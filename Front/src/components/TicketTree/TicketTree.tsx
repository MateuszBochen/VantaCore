import {useMemo} from 'react';
import type {Project} from '@/lib/Project/Type/types';
import type {TicketSummary} from '@/lib/Ticket/Type/types';
import TicketTreeRow, {type TicketTreeRowProps} from './TicketTreeRow';

type TicketTreeProps = Pick<TicketTreeRowProps, 'selectedIds' | 'onToggleSelect' | 'onLoadChildren' | 'onOpenTicket'> & {
  // Flat list - search hits (any depth) or a plain root list.
  tickets: TicketSummary[];
  // Every project the tickets can belong to (for issue type/status/flag
  // lookups). A ticket whose project isn't here still renders, just without
  // those pills.
  projects: Project[];
  // True for search results: rows the search didn't return (children pulled
  // in by expanding) are dimmed. False for a plain unfiltered list.
  dimUnmatched?: boolean;
  // Bump on every FRESH search (not "Load more") - folded into each root's
  // key so React remounts the whole tree instead of reusing a row whose id
  // also appears in the new results. A reused row would keep its expanded
  // children from the PREVIOUS search (real report: filtering down to 2 API
  // results still showed far more rows, because a leftover expanded parent
  // from an earlier, broader search kept its old children mounted).
  generation?: number | string;
};

// Search results as a tree (extracted from SprintTicketPicker, reused by
// TicketsPage and AdvancedSearchPage's ticket section): a hit whose parent is
// also among the hits is nested under it (recomputed over the full
// accumulated list, so it also works across "Load more" pages) instead of
// being rendered a second time as its own top-level row. Paging itself stays
// with the host - it owns the fetches.
const TicketTree = ({tickets, projects, dimUnmatched = false, generation = 0, ...rowProps}: TicketTreeProps) => {
  const {roots, childrenByParentId} = useMemo(() => {
    const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]));
    const childrenByParentId = new Map<string, TicketSummary[]>();

    tickets.forEach((ticket) => {
      if (ticket.parentId && byId.has(ticket.parentId)) {
        const siblings = childrenByParentId.get(ticket.parentId) ?? [];
        siblings.push(ticket);
        childrenByParentId.set(ticket.parentId, siblings);
      }
    });

    const nestedIds = new Set(Array.from(childrenByParentId.values()).flat().map((ticket) => ticket.id));

    return {
      roots: tickets.filter((ticket) => !nestedIds.has(ticket.id)),
      childrenByParentId,
    };
  }, [tickets]);

  const matchedIds = useMemo(() => (dimUnmatched ? new Set(tickets.map((ticket) => ticket.id)) : undefined), [tickets, dimUnmatched]);
  const projectsById = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project])), [projects]);
  const getKnownChildren = (ticketId: string) => childrenByParentId.get(ticketId);

  return (
    <div className="flex flex-col gap-1">
      {roots.map((ticket) => (
        <TicketTreeRow
          key={`${generation}-${ticket.id}`}
          ticket={ticket}
          depth={0}
          projectsById={projectsById}
          getKnownChildren={getKnownChildren}
          matchedIds={matchedIds}
          {...rowProps}
        />
      ))}
    </div>
  );
};

export default TicketTree;
