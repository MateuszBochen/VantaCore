import type {ReactNode} from 'react';
import {Surface} from '@/components/ui/surface';
import {cn} from '@/lib/utils';

type TicketWidgetCardProps = {
  children: ReactNode;
  className?: string;
};

// Shared chrome for every grid tile - a widget's own content (TicketFieldsSidebar,
// TicketCommentsSection, ...) already titles itself where it matters (e.g.
// TicketRelatedSection's own "Related tickets" heading), so this only supplies
// the card boundary and per-tile scrolling every simultaneously-visible tile
// needs once its height is fixed by the grid instead of growing to content.
const TicketWidgetCard = ({children, className}: TicketWidgetCardProps) => (
  <Surface className={cn('flex h-full flex-col overflow-y-auto p-4', className)}>{children}</Surface>
);

export default TicketWidgetCard;
