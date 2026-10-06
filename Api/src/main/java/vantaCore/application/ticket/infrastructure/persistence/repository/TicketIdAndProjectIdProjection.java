package vantaCore.application.ticket.infrastructure.persistence.repository;

import java.util.UUID;

public interface TicketIdAndProjectIdProjection {

    UUID getId();

    UUID getProjectId();
}
