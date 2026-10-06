package vantaCore.application.ticket.domain.history;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface TicketHistoryEntryAggregateRepositoryInterface {

    /** appends a new entry, never overwrites a previous one */
    void save(TicketHistoryEntryAggregate entry);

    /** the single most recent entry strictly older than the given instant, for stepping back through history */
    Optional<TicketHistoryEntryAggregate> findVersionBefore(UUID ticketId, Instant before);

    /** every entry across the given tickets with changedAt in [from, to] (inclusive both ends),
     oldest first - one bulk query instead of per-ticket lookups, for reports spanning a whole
     sprint's worth of tickets. */
    List<TicketHistoryEntryAggregate> findAllByTicketIdInAndChangedAtBetween(Set<UUID> ticketIds, Instant from, Instant to);
}
