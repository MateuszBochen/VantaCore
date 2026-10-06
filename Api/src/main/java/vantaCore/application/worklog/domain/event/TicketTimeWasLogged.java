package vantaCore.application.worklog.domain.event;

import java.util.UUID;

/** Net worklog time changed for a ticket - fired uniformly by create (+minutes), edit
 (new-old delta) and delete (-minutes), since the ticket module only ever needs to know "apply this
 signed delta", not why. */
public record TicketTimeWasLogged(UUID ticketId, int deltaMinutes) {
}
