import {useState, type DragEvent} from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {StatusMeta, Track} from './SprintRailBoard';
import {statusKey} from './statusKey';
import TicketIslandCard from './TicketIslandCard';
import type {Ticket} from '@/lib/Ticket/Type/types';
import type {Flag} from '@/lib/Project/Type/types';

type TicketIslandTrackGridProps = {
  ticket: Ticket;
  gridTemplateColumns: string;
  tracks: Track[];
  trackIndex: number;
  meta: StatusMeta | undefined;
  statusMetaById: Record<string, StatusMeta>;
  allowedNextStatusIds: string[];
  childrenCount: number;
  expanded: boolean;
  onToggleExpand: () => void;
  isEstimable: boolean;
  flags: Flag[];
  hasMeta: boolean;
  onOpenTicket: (ticket: Ticket) => void;
  assignStatus: (statusId: string) => void;
  onOpenStatusPicker: (statusIds: string[], anchor: Element) => void;
  issueTypeColorById: Record<string, string>;
};

// The grid row spanning every column - the expand/collapse button used to
// get its OWN full grid row (fixed permanently in column 1) so it wouldn't
// move with the card - but that left an entire row mostly blank whenever a
// ticket had children (real user feedback 2026-08-07: "duża pusta
// przestrzeń... przenieś expander na lewo od grida, żeby nie blokował
// przestrzeni na tiket"). Fixed by absolutely positioning it INSTEAD,
// straddling the left edge of the tracks grid below (half sitting in the
// existing 12px gutter - the same one the nested-children connector line
// uses - half overlapping column 1's own leftmost pixels) rather than
// reserving a row or a grid column for it. Absolute positioning means it
// takes no layout space at all, so it can't affect the tracks grid's own
// width/alignment the way adding a real column would - it still stays
// fixed in place regardless of which column the card is currently in
// ("expander dzieci powinien zostać na miejscu"), just without an empty
// row alongside it.
const TicketIslandTrackGrid = ({
  ticket,
  gridTemplateColumns,
  tracks,
  trackIndex,
  meta,
  statusMetaById,
  allowedNextStatusIds,
  childrenCount,
  expanded,
  onToggleExpand,
  isEstimable,
  flags,
  hasMeta,
  onOpenTicket,
  assignStatus,
  onOpenStatusPicker,
 issueTypeColorById,
}: TicketIslandTrackGridProps) => {
  const [dragOverTrackId, setDragOverTrackId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // A column can be mapped to statuses from several different issue types
  // (even different projects) - but a given ticket can only ever be set to
  // one of the statuses belonging to ITS OWN issueTypeId, so every status
  // pick has to be filtered down to that before it's offered as a valid
  // drop target (bug found 2026-08-06: the picker was showing every status
  // mapped into the column regardless of issue type).
  const validStatusIds = (track: Track) =>
    track.statusIds.filter((id) => !!statusMetaById[statusKey(ticket.issueTypeId, id)]);

  // Subset of validStatusIds that are ALSO a legal transition from the
  // ticket's current status per the configured workflow - this, not
  // validStatusIds, decides whether a column can be dropped into at all.
  const allowedStatusIds = (track: Track) => validStatusIds(track).filter((id) => allowedNextStatusIds.includes(id));

  // Shared by both drag handles - the label wrapper AND the status pill
  // below - so grabbing either one starts the exact same drag operation.
  const handleDragStart = (event: DragEvent) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', ticket.id);
    // Also stamped as a synthetic MIME TYPE (empty value) carrying this
    // ticket's own id, not just as a `text/plain` value - `dataTransfer
    // .types` is the one thing readable on every OTHER element the drag
    // passes over mid-drag (dragover/dragenter), including a totally
    // different ticket's own island several rows away; `getData` stays
    // locked to the real value until the actual drop fires. Read back via
    // `isDraggingThisTicket` below so a column can tell "a card from THIS
    // row is hovering/dropping" apart from "some OTHER row's card is" -
    // real bug found 2026-09-01: dropping ticket A's card onto ticket B's
    // row silently reassigned ticket B's own status (the row it landed
    // on), leaving A untouched, because the drop handler never checked
    // which ticket had actually been dragged - it only ever looked at
    // its OWN row's ticket via the `assignStatus` closure below.
    event.dataTransfer.setData(`application/x-ticket-id-${ticket.id}`, '');
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverTrackId(null);
  };

  // True only while the card CURRENTLY being dragged belongs to THIS row's
  // own ticket - see the dataTransfer type stamped in handleDragStart. Every
  // dragover/dragenter/drop below is gated on this in addition to the
  // existing `isDroppable` (column-legality) check, so a foreign ticket's
  // card can no longer land on - or even show a "droppable" highlight over -
  // a row it doesn't belong to.
  const isDraggingThisTicket = (event: DragEvent) => event.dataTransfer.types.includes(`application/x-ticket-id-${ticket.id}`);

  // No status ALLOWED by the workflow for this ticket's issue type in that
  // column (either the synthetic "Unmapped status" track, a column that
  // only maps OTHER issue types' statuses, or one where every status IS the
  // right issue type but none is a legal transition from here) has nothing
  // to assign, so it's not a valid target at all. A column with exactly one
  // ISSUE-TYPE-valid status assigns it directly (guaranteed to be allowed,
  // since isDroppable already required at least one allowed option to exist
  // among however many are valid); a column with several opens a popover
  // (anchored at the cell that was dropped on) listing ALL of them, with
  // whichever aren't allowed shown disabled rather than hidden - the user
  // can see what's blocked, not just what's available (explicit ask
  // 2026-08-07, alongside enforcing the workflow at all).
  const handleDrop = (track: Track, anchor: Element) => {
    setDragOverTrackId(null);

    const options = validStatusIds(track);

    if (options.length === 0) {
      return;
    }

    if (options.length === 1) {
      assignStatus(options[0]);
      return;
    }

    onOpenStatusPicker(options, anchor);
  };

  return (
    <div className="relative grid min-h-9 gap-4" style={{gridTemplateColumns}}>
      {childrenCount > 0 && (
        <button
          type="button"
          onClick={onToggleExpand}
          // Straddles the left edge of column 1 (half in the gutter, half
          // over the card) - pushing it further left (`-translate-x-full`)
          // was tried 2026-08-07 to rule out badge/card hit-testing overlap
          // as the cause of "can't drag root tickets", but that pushed it
          // past the scroll container's own edge, where it got silently
          // clipped (`overflow-y-auto` on the ancestor computes
          // `overflow-x` as `auto` too per the CSS spec's visible/
          // non-visible pairing rule, not truly `visible`) - AND dragging
          // was still broken with the badge out of the way, proving the
          // badge was never the real cause. Reverted to this position; see
          // `allowedNextStatusIds` / `isDroppable` for the actual
          // (workflow-gating) suspect.
          className="absolute -left-1 -top-1 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-accent hover:bg-cyan-400/20"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}+{childrenCount}
        </button>
      )}

      {tracks.map((track, index) => {
        // Workflow-gated now, not just issue-type-gated (explicit ask
        // 2026-08-07): a column full of otherwise-valid statuses is still
        // not droppable if NONE of them are a legal transition from here.
        const isDroppable = index !== trackIndex && allowedStatusIds(track).length > 0;

        return (
          <div
            key={track.id}
            // min-h-9 is a floor for the empty drop-target cells - the
            // occupied cell's real card is normally taller than that
            // already, and since every cell here is an item of the SAME
            // grid row, CSS Grid's default `align-items: stretch`
            // auto-matches every other cell's height to it.
            //
            // The hover highlight below is a className on THIS SAME
            // element, never a separate child node - inserting/removing a
            // child in response to dragenter/dragleave is a classic HTML5
            // DnD bug: the moment that child appears, the browser
            // considers the pointer to have moved from this cell INTO the
            // new child, firing dragleave, which removes the child, which
            // fires dragenter again - a rapid flicker loop that also
            // swallows the eventual drop (found 2026-08-06: user reported
            // the drop-target highlight flickering and drops silently
            // failing while hovering).
            //
            // The `isDragging` ring is a WEAKER highlight than the hover
            // one - it lights up on EVERY droppable column as soon as a
            // drag starts (not just the one currently under the cursor),
            // so the user can see all their legal options up front
            // (explicit ask 2026-08-07). Pure className toggling, no DOM
            // mount/unmount and no pointer-events changes - unlike an
            // earlier attempt at a similar "highlight while dragging"
            // idea that broke the drag outright (see memory:
            // project_vantacore_boards_concept), this doesn't touch
            // hit-testing or the DOM tree at all, just a class swap.
            // No px-1 (removed) - it inset the occupied cell's card/shell a
            // few px from the true column edge, while the children-wrapper
            // box below it (and the row backgrounds elsewhere) are flush
            // with that same edge ("no overhang" - see memory:
            // project_vantacore_boards_concept). The mismatch showed up as
            // a visible gap between the card's own shell and the column
            // itself (real user feedback, annotated screenshot).
            className={cn(
              'flex min-h-9 min-w-0 items-stretch rounded-lg',
              isDroppable && isDragging && 'ring-1 ring-inset ring-cyan-400/30',
              isDroppable && dragOverTrackId === track.id && 'border border-dashed border-white/40 bg-muted',
            )}
            onDragOver={(event) => {
              if (isDroppable && isDraggingThisTicket(event)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }
            }}
            onDragEnter={(event) => {
              if (isDroppable && isDraggingThisTicket(event)) {
                event.preventDefault();
                setDragOverTrackId(track.id);
              }
            }}
            onDragLeave={() => setDragOverTrackId((current) => (current === track.id ? null : current))}
            onDrop={(event) => {
              // Not gated on isDroppable/isDraggingThisTicket up front like
              // the others - without a preceding dragover that called
              // preventDefault (blocked above for a foreign ticket), the
              // browser never allows a drop here at all, so `onDrop` simply
              // won't fire for those cases. The explicit re-check stays
              // anyway as the actual state-changing guard, not just relying
              // on the browser default having blocked it upstream.
              event.preventDefault();
              if (isDroppable && isDraggingThisTicket(event)) {
                handleDrop(track, event.currentTarget);
              }
            }}
          >
            {index === trackIndex && meta && (
              <TicketIslandCard
                ticket={ticket}
                // Only "open" (no bottom border/radius) while the children
                // wrapper is ACTUALLY rendered right below to continue the
                // line - that wrapper only shows up when `expanded` too
                // (see TicketIsland's `{expanded && children.length > 0 &&
                // ...}`), not whenever there simply ARE children. Passing
                // the raw count regardless of `expanded` left a collapsed
                // parent's card open-bottomed with nothing below to close
                // it, showing as a border straight-up missing on that one
                // edge (real user feedback, screenshot: "na tikecie
                // VC-1058... na dole nie ma bordru").
                childrenCount={expanded ? childrenCount : 0}
                issueTypeColorById={issueTypeColorById}
                meta={meta}
                isEstimable={isEstimable}
                flags={flags}
                hasMeta={hasMeta}
                statusOptionIds={validStatusIds(track)}
                onOpenTicket={onOpenTicket}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onOpenStatusPicker={(anchor) => onOpenStatusPicker(validStatusIds(track), anchor)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TicketIslandTrackGrid;
