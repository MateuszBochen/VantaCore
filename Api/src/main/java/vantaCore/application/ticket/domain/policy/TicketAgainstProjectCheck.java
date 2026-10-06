package vantaCore.application.ticket.domain.policy;

import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.ticket.domain.TicketAggregate;

public record TicketAgainstProjectCheck(TicketAggregate ticket, ProjectAggregate project) {
}
