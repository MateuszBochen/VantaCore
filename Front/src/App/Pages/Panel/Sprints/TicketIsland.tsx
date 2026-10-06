import {useState} from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {cn} from '@/lib/utils';
import {getReadableTextColor} from '@/lib/Color/getReadableTextColor';
import useSaveTicketHook from '@/lib/Ticket/useSaveTicketHook';
import type {StatusMeta, Track} from './SprintRailBoard';
import {statusKey} from './statusKey';
import type {SelectedEntry} from './sprintRailTree';
import TicketIslandTrackGrid from './TicketIslandTrackGrid';
import TicketIslandChildrenList from './TicketIslandChildrenList';
import StatusPickerPopover, {type StatusPickerState} from './StatusPickerPopover';
import type {Ticket} from '@/lib/Ticket/Type/types';
import type {Flag} from '@/lib/Project/Type/types';

type TicketIslandProps = {
  ticket: Ticket;
  children: SelectedEntry[];
  childrenByParent: Map<string, SelectedEntry[]>;
  gridTemplateColumns: string;
  tracks: Track[];
  trackIndexByStatusId: Record<string, number>;
  statusMetaById: Record<string, StatusMeta>;
  flagsByProjectId: Record<string, Flag[]>;
  estimableByIssueTypeId: Record<string, boolean>;
  issueTypeColorById: Record<string, string>;
  // Whether the PREVIOUS/NEXT sibling in this same children list shares
  // this ticket's issue type - when true, the shared edge (top for
  // `mergeWithPrevious`, bottom for `mergeWithNext`) drops its border and
  // corner rounding, so two same-type tickets in a row read as one
  // continuous block instead of two visually separate cards (explicit ask
  // 2026-08-07). Always `false` for a sprint root - only nested siblings
  // within one `children` list can merge.
  mergeWithPrevious: boolean;
  mergeWithNext: boolean;
  // Gap (px) above this island. Normally 6 (matches the non-merged
  // sibling spacing elsewhere), but 0 for the first item in a list (its
  // parent container's own `mt-1.5` already provides that space) and 0
  // when `mergeWithPrevious` - a real CSS `gap`/margin here would leave a
  // sliver where the page's background shows through between two
  // same-color boxes, which reads as a dividing line even though neither
  // box has its own border there anymore (found 2026-08-07 via DevTools,
  // after border/radius alone turned out NOT to be the cause of a
  // reported stray line - see mergeWithPrevious/mergeWithNext above).
  // Passed as an explicit number rather than left to a shared `gap-*` on
  // the parent because a CSS `gap` can't be conditionally zeroed for just
  // one pair of items.
  topSpacing: number;
  // False only for a sprint's root ticket when the root itself was never
  // actually added to the sprint (see SprintBoardPage's own railTickets
  // comment - a rail's root is always the topmost ancestor, walked to
  // regardless of sprint membership, purely as a grouping anchor). Every
  // OTHER island rendered here always comes from rail.selected (see
  // buildChildrenByParent - it only ever groups actually-selected entries),
  // so this is always true below the root. A ticket that isn't in the
  // sprint gets no drag/status/estimate body at all - just a plain dashed
  // legend frame (its key) around whatever children it's grouping.
  inSprint: boolean;
  onOpenTicket: (ticket: Ticket) => void;
};

// One "island" per ticket - root OR any nested selected descendant, same
// treatment recursively (explicit ask: "każdy zagnieżdżony tiket też
// powinien mieć wyspę z własnym kolorem i przesuwalnym statusem"). A
// translucent background/border tinted from the ticket's OWN issue type
// color, spanning every column flush with the background (no overhang -
// see memory: project_vantacore_boards_concept).
//
// Settled 2026-08-07, after two false starts the same day: first a full
// "move the whole card, including the expander" redesign (reverted - too
// hard to tell which ticket nests under which once EVERYTHING, including
// the expand button, could land in any column), then a "keep name/
// attributes fixed, just widen the drag handle" attempt (rejected outright
// - "chyba nic się nie zmieniło", not what was actually being asked for).
// The ask, precisely: "razem ze statusem przesuwała się też nazwa tiketu i
// jego atrybuty czyli flagi tagi ilość SP, a expander dzieci powinien
// zostać na miejscu" - so the island now has two rows sharing the SAME
// `gridTemplateColumns` as the background: a small FIXED row holding only
// the expand/collapse button, permanently in column 1 (see
// TicketIslandTrackGrid); and a MOVING row where the ticket's name,
// estimate, flags/tags/assignees, AND the status name all travel together
// as one draggable card into whichever column matches the current status
// (see TicketIslandCard). Splitting expander vs. everything-else into two
// separate rows (rather than folding the expander into the moving card,
// like the first reverted attempt did) is what keeps the expander at a
// stable position per ticket regardless of which column its card is
// currently in.
const TicketIsland = ({
  ticket,
  children,
  childrenByParent,
  gridTemplateColumns,
  tracks,
  trackIndexByStatusId,
  statusMetaById,
  flagsByProjectId,
  estimableByIssueTypeId,
  issueTypeColorById,
  mergeWithNext,
  topSpacing,
  inSprint,
  onOpenTicket,
}: TicketIslandProps) => {
  const [expanded, setExpanded] = useState(true);
  const [statusPicker, setStatusPicker] = useState<StatusPickerState | null>(null);
  const {saveTicket} = useSaveTicketHook();
  const islandColor = issueTypeColorById[ticket.issueTypeId];

  // Not actually in the sprint (only possible for a rail's root - see
  // inSprint's own comment) - no drag/status/estimate body to show at all,
  // just a plain dashed frame with its key as a <legend>, grouping whatever
  // children it has. A real <fieldset>/<legend> border cutout ("jak kiedyś
  // działało"), not a div faked with an absolutely-positioned span - the
  // browser skips drawing the border segment under a <legend> natively, no
  // background-color-matching hack needed. NEUTRAL (bg-muted/border-border
  // tokens), not tinted by the issue type color the way a real island's
  // background is - alpha-blending a saturated color onto a bright LIGHT
  // theme surface reads far more vivid than the exact same blend on a dark
  // one (less luminance headroom to absorb it into), so what looked like a
  // subtle tint in dark mode came out as a loud, eye-catching green wash in
  // light mode (real user feedback, screenshot). The key chip below still
  // carries the issue type color - a small chip staying saturated is fine
  // and consistent with every other badge in this app; a whole row-spanning
  // background doing the same isn't. NO extra left margin/indent on the
  // children below - they need the EXACT same horizontal start as every
  // other island so their own status slider still lines up with the real
  // column grid underneath; indenting them would silently misalign every
  // nested ticket's slider from the columns it's actually supposed to sit
  // in.
  if (!inSprint) {
    return (
      <fieldset
        className="m-0 min-w-0 border border-dashed border-border bg-muted/30 p-0 pt-1.5 pb-1.5"
        style={{marginTop: topSpacing, borderRadius: 8}}
      >
        <legend className="ml-2 flex items-center gap-1 px-1">
          {children.length > 0 && (
            <button type="button" onClick={() => setExpanded((current) => !current)} className="flex items-center text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          )}
          <span
            className="rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide"
            style={{
              borderColor: islandColor ? `${islandColor}80` : 'rgba(255,255,255,0.2)',
              backgroundColor: islandColor ? `${islandColor}40` : 'rgba(255,255,255,0.1)',
              color: islandColor ? getReadableTextColor(islandColor) : undefined,
            }}
          >
            {ticket.key}
          </span>
        </legend>

        {expanded && children.length > 0 && (
          <TicketIslandChildrenList
            className="flex flex-col"
            entries={children}
            childrenByParent={childrenByParent}
            gridTemplateColumns={gridTemplateColumns}
            tracks={tracks}
            trackIndexByStatusId={trackIndexByStatusId}
            statusMetaById={statusMetaById}
            flagsByProjectId={flagsByProjectId}
            estimableByIssueTypeId={estimableByIssueTypeId}
            issueTypeColorById={issueTypeColorById}
            onOpenTicket={onOpenTicket}
          />
        )}
      </fieldset>
    );
  }

  const meta = statusMetaById[statusKey(ticket.issueTypeId, ticket.statusId)];
  const trackIndex = trackIndexByStatusId[ticket.statusId] ?? 0;
  // The configured workflow (Project Settings) for the ticket's CURRENT
  // status - which other statuses it's actually allowed to move to.
  // Previously any status could jump to any other, ignoring this entirely
  // (explicit ask 2026-08-07 to stop that).
  const allowedNextStatusIds = meta?.allowedTransitionIds ?? [];
  const flags = ticket.flagIds.flatMap((id) => {
    const flag = flagsByProjectId[ticket.projectId]?.find((candidate) => candidate.id === id);
    return flag ? [flag] : [];
  });
  const hasMeta = flags.length > 0 || ticket.tags.length > 0 || ticket.assigneeIds.length > 0;
  // Undefined (project data not loaded yet) is treated the same as
  // estimable=true, so a fresh page load doesn't briefly flash the
  // crossed-out "not estimable" icon before settling.
  const isEstimable = estimableByIssueTypeId[ticket.issueTypeId] ?? true;

  const assignStatus = (statusId: string) => {
    setStatusPicker(null);

    if (statusId === ticket.statusId || !allowedNextStatusIds.includes(statusId)) {
      return;
    }

    void saveTicket(ticket.projectId, {...ticket, statusId});
  };

  return (
    <div
      // Bottom padding is skipped whenever children are actually showing
      // below - the LAST rendered child is itself a full TicketIsland with
      // its OWN pt-1.5/pb-1.5, so keeping THIS box's own bottom padding on
      // top of that stacked an extra, purely decorative gap after the last
      // child specifically (real user feedback 2026-08-07: "każdy taki ma
      // [tę przestrzeń], ale ostatni nie powinien" - every nested box has
      // this padding, which is fine BETWEEN siblings, but shouldn't double
      // up at the very end of the stack, where nothing follows it).
      //
      // mergeWithPrevious/mergeWithNext are a SEPARATE concern (border +
      // corner rounding ONLY, padding/spacing untouched) - two ADJACENT
      // SIBLINGS of the same issue type drop the border+rounding on their
      // shared edge, so there's no dividing LINE between them (explicit
      // ask 2026-08-07). First attempt also zeroed padding/margin on that
      // edge, which technically achieved "one continuous block" but made
      // the two tickets' own content (title/flags of one, badge of the
      // next) sit close enough to read as ambiguous which line belonged
      // to which ticket - real follow-up feedback the same day ("tutaj
      // brakuje przerwy"). Padding/margin between siblings is therefore
      // back to normal regardless of merge state; only the border+corner
      // disappears.
      //
      // Border WIDTH is set via inline `style` below, not `border-t-0`/
      // `border-b-0` classes - Tailwind's directional overrides only win
      // over the bare `border` utility if they happen to be later in the
      // GENERATED stylesheet, which is governed by Tailwind's own utility
      // ordering, NOT by argument order in `cn()` - so `border-t-0`
      // silently lost the cascade here and the border stayed fully
      // visible on merged edges (real bug found 2026-08-07 via screenshot:
      // "jedna część podzieliła się na dwie części" - a stray full-width
      // line splitting what should've been one seamless block). Inline
      // style has unconditional priority over ANY class, so this can't
      // recur regardless of Tailwind's internal ordering.
      className={cn('pt-1.5', (!expanded || children.length === 0) && 'pb-1.5')}
      // Corner radius moved to inline style for the same reason border-
      // width was (see below) - `rounded-t-none`/`rounded-b-none` lost the
      // SAME cascade fight against the bare `rounded-lg` utility, so a
      // "merged" edge kept its rounded corners even once its border was
      // correctly zeroed - the rounding alone was enough to carve a thin
      // sliver of the page's dark background out of each corner right at
      // the seam, reading as a stray line the full width of the board
      // (confirmed 2026-08-07 via screenshot with two SAME-issue-type
      // siblings, both DONE, that still showed a dividing line).
      style={{
        marginTop: topSpacing,

        /*clipPath: 'polygon(25% 0px, 49% 0px, 49% 42%, 103% 42%, 101% 101%, 0px 102%, 0px 42%, 25% 42%)',*/

      }}
    >
      {/* The outer box (border+bg, tinted by issue type) spans every
          column flush with the background (no overhang - see memory:
          project_vantacore_boards_concept). See TicketIslandTrackGrid for
          why the expander button is absolutely positioned instead of
          taking its own grid row/column. */}
      <TicketIslandTrackGrid
        ticket={ticket}
        gridTemplateColumns={gridTemplateColumns}
        issueTypeColorById={issueTypeColorById}
        tracks={tracks}
        trackIndex={trackIndex}
        meta={meta}
        statusMetaById={statusMetaById}
        allowedNextStatusIds={allowedNextStatusIds}
        childrenCount={children.length}
        expanded={expanded}
        onToggleExpand={() => setExpanded((current) => !current)}
        isEstimable={isEstimable}
        flags={flags}
        hasMeta={hasMeta}
        onOpenTicket={onOpenTicket}
        assignStatus={assignStatus}
        onOpenStatusPicker={(statusIds, anchor) => setStatusPicker({statusIds, anchor})}
      />


      {expanded && children.length > 0 && (
        <div
          // No REAL top border on the wrapper itself (border-width can't
          // vary along one edge, so a single top border here is always
          // either "on for the whole row width" or "off entirely" - see
          // the faked, per-column one right below for why that's wrong).
          // Top-left/top-right radius similarly dropped: this wrapper
          // spans the FULL row width, not just the shell's own status-
          // column width, so a rounded top corner only makes sense where
          // the shell is actually sitting above it - everywhere else it
          // was a stray rounded corner in empty space (real user
          // feedback, annotated screenshot).
          className="relative"
          style={{
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: mergeWithNext ? 0 : 8,
            borderBottomRightRadius: 8,
            borderStyle: 'solid',
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderTopWidth: 0,
            borderBottomWidth: 1,
            borderColor: islandColor ? `${islandColor}80` : 'rgba(255,255,255,0.1)',
            backgroundColor: islandColor ? `${islandColor}49` : 'rgba(255,255,255,0.8)',
            paddingBottom: '10px',
          }}
        >
          {/* Fakes the "rest of the top border" - a real border can't skip
              a segment of one edge, so this is laid out on the SAME
              gridTemplateColumns/gap as the shell above, as at most TWO
              pieces: everything BEFORE trackIndex, and everything AFTER
              it - each piece spans several grid tracks as ONE item, so any
              gap-4 gutters INSIDE that span are naturally bridged (a
              single spanning grid item's own box already includes its
              internal gaps, same as the Roadmap timeline's own connector
              band). One-strip-per-column (tried first) instead put a
              visible break at EVERY column boundary, not just at the
              shell's own column. A full-width strip + a same-column mask
              painted over it (tried next) put the border pixel-for-pixel
              back under the shell itself again, since the mask's own
              translucent color stacked on top of the strip's rather than
              replacing it - reverted per explicit user feedback
              ("wróciłeś do punktu wyjścia, cofnij").
              Even with the "two pieces" grid span bridging gaps INSIDE
              its own span, each piece's outer edge still lands at the
              far side of the LAST gap it doesn't span into - a grid
              item ending at line trackIndex+1 stops at the trailing edge
              of the previous track, one whole gap-4 short of the shell's
              own edge, and same on the other side - leaving exactly the
              two slivers the user circled in a screenshot right next to
              the shell. Closed with a negative margin sized to gap-4
              (1rem) on the piece's shell-facing side, stretching it the
              rest of the way to butt up against the shell's own edge
              without touching the shell's own column. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 grid gap-4" style={{gridTemplateColumns, height: 1}}>
            {trackIndex > 0 && (
              <div
                style={{
                  gridColumn: `1 / ${trackIndex + 1}`,
                  marginRight: '-1rem',
                  backgroundColor: islandColor ? `${islandColor}80` : 'rgba(255,255,255,0.1)',
                }}
              />
            )}
            {trackIndex < tracks.length - 1 && (
              <div
                style={{
                  gridColumn: `${trackIndex + 2} / -1`,
                  marginLeft: '-1rem',
                  backgroundColor: islandColor ? `${islandColor}80` : 'rgba(255,255,255,0.1)',
                }}
              />
            )}
          </div>

          {/* No top margin here - a gap between the wrapper's own top
              border and the first child's own content left a band where
              only the wrapper's own translucent background was visible
              (no child-level color stacked on top of it), reading as a
              lighter seam right below the card (found via annotated
              screenshot). */}
          <TicketIslandChildrenList
            className="flex flex-col"
            entries={children}
            childrenByParent={childrenByParent}
            gridTemplateColumns={gridTemplateColumns}
            tracks={tracks}
            trackIndexByStatusId={trackIndexByStatusId}
            statusMetaById={statusMetaById}
            flagsByProjectId={flagsByProjectId}
            estimableByIssueTypeId={estimableByIssueTypeId}
            issueTypeColorById={issueTypeColorById}
            onOpenTicket={onOpenTicket}
          />
        </div>
      )}


      {statusPicker && (
        <StatusPickerPopover
          picker={statusPicker}
          issueTypeId={ticket.issueTypeId}
          statusMetaById={statusMetaById}
          allowedNextStatusIds={allowedNextStatusIds}
          onSelect={assignStatus}
          onClose={() => setStatusPicker(null)}
        />
      )}
    </div>
  );
};

export default TicketIsland;
