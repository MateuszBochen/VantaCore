import {memo} from 'react';
import {Link} from 'react-router-dom';
import type {Ticket} from '@/lib/Ticket/Type/types';

type TicketBreadcrumbProps = {
  projectId: string;
  // Root-first, NOT including the current ticket - see TicketEditor's
  // ancestor-resolving effect (walks up parentId via getTicket).
  ancestors: Ticket[];
  currentTitle: string;
  ticketKey: string;
};

// "root / parent / ... / current" path shown next to a ticket's key, so
// there's a way back up the parent chain without leaving via the generic
// "Tickets" back button. The current ticket is a link too (not just the
// ancestors) - on the real route it's a no-op ("you're already here"), but
// this same component also renders inside TicketPopup/TicketChildrenStep's
// floating windows, where "here" is a popup, not the real page - this is
// what lets you jump from one of those to the actual full-page view. Only
// linkable once there's a real key to link to (a brand-new, unsaved draft
// has nothing to navigate to yet).
const TicketBreadcrumb = memo(({projectId, ancestors, currentTitle, ticketKey}: TicketBreadcrumbProps) => (
  <div className="flex flex-col items-end gap-1">
    <span className="flex min-w-0 max-w-md items-center gap-1 text-xs text-muted-foreground">
      {ancestors.map((ancestor) => (
        <span key={ancestor.id} className="flex min-w-0 items-center gap-1">
          <Link to={`/projects/${projectId}/tickets/${ancestor.id}`} className="truncate hover:text-muted-foreground">
            {ancestor.title || ancestor.key}
          </Link>
          <span className="shrink-0 text-muted-foreground">/</span>
        </span>
      ))}

      {ticketKey ? (
        <Link to={`/projects/${projectId}/tickets/${ticketKey}`} className="min-w-0 truncate text-muted-foreground hover:text-muted-foreground">
          {currentTitle || 'New ticket'}
        </Link>
      ) : (
        <span className="min-w-0 truncate text-muted-foreground">{currentTitle || 'New ticket'}</span>
      )}

      <span className="shrink-0 text-muted-foreground">-</span>

      <span className="text-xs text-muted-foreground">{ticketKey || 'Draft — key assigned on save'}</span>
    </span>
  </div>
));

TicketBreadcrumb.displayName = 'TicketBreadcrumb';

export default TicketBreadcrumb;
