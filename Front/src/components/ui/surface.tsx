import type {ComponentProps} from 'react';
import {cn} from '@/lib/utils';

type SurfaceProps = ComponentProps<'div'> & {
  // An active/edit state wants to stand out from its sibling rows without
  // losing this same semi-transparent fill.
  accent?: boolean;
};

// The semi-transparent "row/panel on a themed gradient background" look
// used throughout Tickets (TicketRow, TicketChildrenStep) - bg-card/
// bg-popover render as a flat opaque box that ignores the active theme's
// background gradient entirely. One shared component so a look like this
// only ever needs fixing in one place - every callsite used to hand-roll
// its own `rounded-* border border-border bg-white/[0.03] p-*` string,
// which is exactly how TicketWorklogSection ended up with its manual-log
// panel still on the old opaque background after its entry rows were
// already fixed to match this.
//
// Extends native div props (not just className/children) - TicketComments
// Section needs `id` on its comment rows for scroll-to-highlight, and a
// caller-supplied `className` can still override the base border/background
// entirely (e.g. a highlighted comment's `border-accent bg-accent/10`)
// since cn() resolves conflicting Tailwind utilities via tailwind-merge,
// not plain string concatenation.
const Surface = ({className, accent, ...props}: SurfaceProps) => (
  <div className={cn('rounded-lg border bg-white/[0.03]', accent ? 'border-cyan-400/40' : 'border-border', className)} {...props} />
);

export {Surface};
