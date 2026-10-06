import TicketSidebar from '../TicketSidebar';
import type {ProjectSprintOption} from '@/lib/Sprint/useListProjectSprintsHook';
import type {Project} from '@/lib/Project/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

type PrismSidebarWidgetProps = {
  project: Project;
  ticket: Ticket;
  onChange: (patch: Partial<Ticket>) => void;
  projectId: string;
  isNew: boolean;
  sprintOptions: ProjectSprintOption[];
};

// The 'default' layout's only non-description tile - a pass-through to the
// existing rotating 3D prism (TicketSidebar), untouched.
//
// TicketSidebar's own root div was built for its original context (a flex
// row with align-items:stretch giving it height for free, and a hardcoded
// `lg:w-80` since that row's sidebar was always exactly 320px) - neither
// holds inside a react-grid-layout tile, which is a plain absolutely-
// positioned box with an explicit pixel height/width of its own and no flex
// parent to stretch from. Confirmed live: the card measured ~148px tall
// (collapsed to near-nothing) inside a 784px-tall grid cell, with ~300px of
// dead space to its right (360px card in a 657px-wide cell).
//
// Forcing TicketSidebar's DIRECT CHILD root to h-full/w-full via this
// wrapper (rather than editing TicketSidebar.tsx itself, which stays
// untouched per the layout-system plan) restores the same "fill whatever
// I'm given" behavior the old flex-stretch context provided for free -
// including making its own `min-h-0 flex-1` viewport correctly fill the
// resulting real height again. Trade-off: the sidebar's width now
// proportionally follows DEFAULT_TEMPLATE's grid split (today ~8:4 with
// description) instead of always being exactly 320px - tune that split in
// ticketLayoutTemplates.ts if the ratio feels off, no CSS changes needed.
const PrismSidebarWidget = ({project, ticket, onChange, projectId, isNew, sprintOptions}: PrismSidebarWidgetProps) => (
  <div className="h-full [&>div]:!h-full [&>div]:!w-full">
    <TicketSidebar project={project} ticket={ticket} onChange={onChange} projectId={projectId} isNew={isNew} sprintOptions={sprintOptions} />
  </div>
);

export default PrismSidebarWidget;
