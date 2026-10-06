package vantaCore.application.ticket.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.ticket.infrastructure.persistence.entity.TicketHistoryEntryEntity;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataTicketHistoryRepositoryInterface extends JpaRepository<TicketHistoryEntryEntity, UUID> {

    Optional<TicketHistoryEntryEntity> findFirstByTicketIdAndChangedAtBeforeOrderByChangedAtDesc(UUID ticketId, Instant before);

    List<TicketHistoryEntryEntity> findAllByTicketIdInAndChangedAtBetweenOrderByChangedAtAsc(
        Collection<UUID> ticketIds, Instant from, Instant to
    );
}
