import {memo, useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus, X} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {Select} from '@/components/ui/select';
import {Surface} from '@/components/ui/surface';
import TicketPickerInput, {type PickedTicket} from '../../MyWorklog/TicketPickerInput';
import type {Ticket, TicketRelationType} from '@/lib/Ticket/Type/types';

type TicketRelatedSectionProps = {
  ticket: Ticket;
  // A patch, not the whole next Ticket - see TicketFieldsSidebar's onChange
  // comment for why.
  onChange: (patch: Partial<Ticket>) => void;
};

// Picked from THIS ticket's own point of view when adding a relation (e.g.
// picking "Blocks" here means "this ticket blocks the one you just
// searched for") - the backend materializes the inverse on the other
// ticket automatically (its own GET comes back with IS_BLOCKED_BY against
// this one), so the frontend never computes/flips a direction itself.
const RELATION_TYPE_LABELS: Record<TicketRelationType, string> = {
  BLOCKS: 'Blocks',
  IS_BLOCKED_BY: 'Is blocked by',
  RELATES_TO: 'Relates to',
  DUPLICATES: 'Duplicates',
  IS_DUPLICATED_BY: 'Is duplicated by',
  IMPACTS: 'Impacts',
  IS_IMPACTED_BY: 'Is impacted by',
};

const RELATION_TYPE_OPTIONS = (Object.keys(RELATION_TYPE_LABELS) as TicketRelationType[]).map((type) => ({
  value: type,
  label: RELATION_TYPE_LABELS[type],
}));

// Blocking relationships get a flagged (amber) badge instead of the neutral
// one every other type uses - that pair is the one actionable "something's
// stuck" signal among the seven, the rest are just informational context.
const isBlockingType = (type: TicketRelationType): boolean => type === 'BLOCKS' || type === 'IS_BLOCKED_BY';

// Typed, searchable ticket links (2026-08-20 redesign) - replaces the old
// flat relatedTicketIds: string[] (paste-a-uuid, no type, per-id getTicket
// resolution). key/title/projectId are already denormalized on each
// TicketRelation (see that type's own comment), and TicketPickerInput's
// search result carries the same shape, so adding one is synchronous - no
// extra fetch needed either to add or to display.
const TicketRelatedSection = memo(({ticket, onChange}: TicketRelatedSectionProps) => {
  const [pickedTicket, setPickedTicket] = useState<PickedTicket | null>(null);
  const [relationType, setRelationType] = useState<TicketRelationType>('RELATES_TO');

  // Falls back to [] - the backend hasn't shipped this field on GET yet
  // (2026-08-20), so an existing ticket's response still comes back without
  // relatedTickets at all rather than an empty array. Remove this fallback
  // once that's live; ticket.relatedTickets itself stays typed as required
  // since that's the agreed contract, not "possibly absent".
  const relatedTickets = ticket.relatedTickets ?? [];

  const alreadyRelated = pickedTicket ? relatedTickets.some((relation) => relation.ticketId === pickedTicket.id) : false;
  const canAdd = pickedTicket !== null && pickedTicket.id !== ticket.id && !alreadyRelated;

  const handleAdd = () => {
    if (!pickedTicket || !canAdd) {
      return;
    }

    onChange({
      relatedTickets: [
        ...relatedTickets,
        {ticketId: pickedTicket.id, type: relationType, key: pickedTicket.key, title: pickedTicket.title, projectId: pickedTicket.projectId},
      ],
    });
    setPickedTicket(null);
  };

  const handleRemove = (ticketId: string) => {
    onChange({relatedTickets: relatedTickets.filter((relation) => relation.ticketId !== ticketId)});
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">Related tickets</p>

      {relatedTickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No related tickets.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {relatedTickets.map((relation) => (
            <Surface key={relation.ticketId} className="flex items-center gap-2 px-3 py-2 text-sm">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span
                  className={cn(
                    'w-fit rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                    isBlockingType(relation.type) ? 'border-amber-400/30 bg-amber-400/10 text-amber-400' : 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {RELATION_TYPE_LABELS[relation.type]}
                </span>

                <Link to={`/projects/${relation.projectId}/tickets/${relation.ticketId}`} className="min-w-0 truncate text-foreground hover:underline">
                  <span className="text-muted-foreground">{relation.key}</span> {relation.title}
                </Link>
              </div>

              <Button
                variant="ghost"
                size="icon"
                disableRipple
                onClick={() => handleRemove(relation.ticketId)}
                className="h-6 w-6 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </Surface>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <TicketPickerInput value={pickedTicket} onChange={setPickedTicket} />

        <div className="flex items-center gap-2">
          <Select
            value={relationType}
            onValueChange={(value) => setRelationType(value as TicketRelationType)}
            options={RELATION_TYPE_OPTIONS}
            className="flex-1"
          />

          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd} disabled={!canAdd}>
            Add
          </Button>
        </div>

        {alreadyRelated && <p className="text-xs text-muted-foreground">Already related - remove it below first to change its type.</p>}
      </div>
    </div>
  );
});

TicketRelatedSection.displayName = 'TicketRelatedSection';

export default TicketRelatedSection;
