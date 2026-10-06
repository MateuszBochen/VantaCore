import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

// The standard "main page" wrapper every WorkPlace route renders as its
// root - full height/width, vertical stack, consistent gap/padding. Was
// hand-copied as `<div className="flex h-full w-full flex-col gap-6 p-8">`
// into 15 different page components before this existed. This h-full is
// fixed to WorkPlace's dashed-border box, not to content - overflow-y-auto
// is baked in here (not left for each page to remember) so any page taller
// than the viewport (e.g. ProjectOverview's stacked charts) scrolls inside
// that box by default instead of silently overflowing past it (a bug that
// kept recurring across pages before this was the default - see git
// history around 2026-08-27). Pages that need a pinned header/footer with
// only some inner region scrolling (e.g. TicketEditor, ProfilePage) still
// add their own nested `min-h-0 flex-1 overflow-y-auto` div for that - this
// default doesn't fight it, since a properly flex-shrunk inner region never
// grows the outer box past its own bound in the first place. Pages that
// scroll differently, or use a genuinely different shape (e.g.
// SprintBoardPage's asymmetric padding for its own scroll region), override
// via `className` same as any other case.
const PageContainer = ({children, className}: PageContainerProps) => (
  <div className={cn('flex h-full w-full flex-col gap-6 overflow-y-auto p-8', className)}>{children}</div>
);

export {PageContainer};
