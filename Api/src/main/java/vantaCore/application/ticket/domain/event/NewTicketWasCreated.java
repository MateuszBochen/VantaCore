package vantaCore.application.ticket.domain.event;

import vantaCore.application.ticket.domain.TicketSnapshot;

public record NewTicketWasCreated(TicketSnapshot ticket) {
}
