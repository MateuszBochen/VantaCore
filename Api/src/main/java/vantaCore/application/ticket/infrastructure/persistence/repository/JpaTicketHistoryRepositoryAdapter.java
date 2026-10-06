package vantaCore.application.ticket.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.ticket.domain.history.TicketHistoryEntryAggregate;
import vantaCore.application.ticket.domain.history.TicketHistoryEntryAggregateRepositoryInterface;
import vantaCore.application.ticket.infrastructure.persistence.entity.TicketHistoryEntryEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public class JpaTicketHistoryRepositoryAdapter implements TicketHistoryEntryAggregateRepositoryInterface {

    private final SpringDataTicketHistoryRepositoryInterface repository;

    public JpaTicketHistoryRepositoryAdapter(SpringDataTicketHistoryRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(TicketHistoryEntryAggregate entry) {
        this.repository.save(TicketHistoryEntryEntity.fromDomain(entry));
    }

    @Override
    public Optional<TicketHistoryEntryAggregate> findVersionBefore(UUID ticketId, Instant before) {
        return this.repository.findFirstByTicketIdAndChangedAtBeforeOrderByChangedAtDesc(ticketId, before)
            .map(TicketHistoryEntryEntity::toDomain);
    }

    @Override
    public List<TicketHistoryEntryAggregate> findAllByTicketIdInAndChangedAtBetween(Set<UUID> ticketIds, Instant from, Instant to) {
        if (ticketIds.isEmpty()) {
            return List.of();
        }

        return this.repository.findAllByTicketIdInAndChangedAtBetweenOrderByChangedAtAsc(ticketIds, from, to).stream()
            .map(TicketHistoryEntryEntity::toDomain)
            .toList();
    }
}
