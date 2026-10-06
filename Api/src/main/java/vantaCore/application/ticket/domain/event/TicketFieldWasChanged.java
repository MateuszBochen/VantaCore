package vantaCore.application.ticket.domain.event;

import vantaCore.application.ticket.domain.TicketSnapshot;

/** Fired once per custom field whose value genuinely changed in this save (diffed inside
 UpsertTicketCommandHandler, same reasoning as TicketStatusWasChanged) - a save touching 3 custom
 fields dispatches 3 of these, not one carrying a set, so a listener filtering on one specific
 fieldId (see the Automation Engine's TICKET_FIELD_CHANGED trigger) doesn't have to unpack a
 collection itself. fieldId is always a CustomFieldDefinition id - this event only covers custom
 fields, not built-in ones (title/status/etc. have their own dedicated events where they matter). */
public record TicketFieldWasChanged(TicketSnapshot ticket, String fieldId) {
}
