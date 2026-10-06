package vantaCore.application.ticket.appliaction.query.bulkUpdateTickets;

import java.util.UUID;

public record BulkTicketActionItemResult(UUID ticketId, boolean success, String error) {
}
