import type {DragEvent} from 'react';
import {CircleSlash} from 'lucide-react';
import {UserChip} from '@/components/ui/user-chip';
import {getReadableTextColor} from '@/lib/Color/getReadableTextColor';
import type {StatusMeta} from './SprintRailBoard';
import type {Ticket} from '@/lib/Ticket/Type/types';
import type {Flag} from '@/lib/Project/Type/types';

type TicketIslandCardProps = {
  ticket: Ticket;
  meta: StatusMeta;
  isEstimable: boolean;
  flags: Flag[];
  hasMeta: boolean;
  childrenCount?: number;
  statusOptionIds: string[];
  onOpenTicket: (ticket: Ticket) => void;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: () => void;
  onOpenStatusPicker: (anchor: Element) => void;
  issueTypeColorById: Record<string, string>;
};

// The card that lives in whichever track column matches the ticket's
// current status - name/estimate/flags/tags/assignees AND the status pill
// all travel together as one draggable unit (see TicketIsland's own comment
// for why the expander button is deliberately NOT part of this card).
const TicketIslandCard = ({
  ticket,
  meta,
  isEstimable,
  flags,
  hasMeta,
  statusOptionIds,
  onOpenTicket,
  onDragStart,
  onDragEnd,
  onOpenStatusPicker,
  issueTypeColorById,
  childrenCount,
}: TicketIslandCardProps) => {
  const islandColor = issueTypeColorById[ticket.issueTypeId];
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="flex w-full min-w-0 gap-1 cursor-grab flex-col px-2 py-1.5 active:cursor-grabbing"
      style={childrenCount ?{
        borderTopLeftRadius: 8,
        borderTopRightRadius:  8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderStyle: 'solid',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 0,
        borderColor: islandColor ? `${islandColor}80` : 'rgba(255,255,255,0.1)',
        backgroundColor: islandColor ? `${islandColor}49` : 'rgba(255,255,255,0.8)',
        /*border: 'solid 1px #f00',*/
      } : {}}
    >
      <div
        className="flex w-full min-w-0 flex-col gap-1 rounded-lg border px-2 py-1.5 active:cursor-grabbing"
        style={{
          borderColor: `${meta.color}80`,
          backgroundColor:
            `${meta.color}59`,
          /*border: 'solid 1px #f00'*/

        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isEstimable ? (
            ticket.estimate !== null && (
              <span
                title={`Estimate: ${ticket.estimate}`}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground"
              >
                {ticket.estimate}
              </span>
            )
          ) : (
            <span title="Not estimable" className="flex h-4 w-4 shrink-0 items-center justify-center">
              <CircleSlash className="h-3.5 w-3.5 text-muted-foreground"/>
            </span>
          )}

          <button
            type="button"
            onClick={() => onOpenTicket(ticket)}
            className="min-w-0 flex-1 truncate text-left text-xs text-foreground hover:underline"
          >
            {ticket.key} · {ticket.title}
          </button>

          <button
            type="button"
            onClick={(event) => {
              // Clicking (not just dragging) also offers the other statuses in
              // THIS SAME column, when there are any - otherwise dragging
              // cross-column was the only way to ever reach a sibling status
              // within one column.
              if (statusOptionIds.length > 1) {
                onOpenStatusPicker(event.currentTarget);
              }
            }}
            className="shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase"
            // A same-hue label straight in `meta.color` on this same-hue badge
            // background reads as low-contrast regardless of which hue it is
            // (e.g. red-on-red) - real user feedback 2026-08-07. The badge
            // itself stays tinted by the status color (border/bg), but the TEXT
            // switches to whichever of near-black/white actually contrasts
            // against that color, via WCAG relative luminance (see
            // getReadableTextColor).
            style={{
              borderColor: `${meta.color}66`,
              backgroundColor: `${meta.color}80`,
              color: getReadableTextColor(meta.color),
            }}
          >
            {meta.name}
          </button>
        </div>

        {hasMeta && (
          <div className="flex flex-wrap items-center gap-1">
            {flags.map((flag) => (
              <span
                key={flag.id}
                className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                style={{backgroundColor: `${flag.color}33`, color: flag.color}}
              >
                {flag.name}
              </span>
            ))}

            {ticket.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {tag}
              </span>
            ))}

            {ticket.assigneeIds.map((id) => (
              <UserChip key={id} userId={id} className="py-0 text-[9px]"/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketIslandCard;
