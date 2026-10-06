package vantaCore.application.worklog.domain.repository;

import vantaCore.application.worklog.domain.WorklogEntryAggregate;
import vantaCore.application.worklog.domain.vo.WorklogEntryId;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface WorklogEntryAggregateRepositoryInterface {

    void save(WorklogEntryAggregate entry);

    Optional<WorklogEntryAggregate> findById(WorklogEntryId id);

    /** newest first */
    List<WorklogEntryAggregate> findAllByTicketId(UUID ticketId);

    void deleteById(WorklogEntryId id);

    /** Entries for any of these users with date in [startDate, endDate] (inclusive both ends),
     most recent first, 0-indexed page - backs GET /api/worklog/mine (userIds defaults to just the
     caller when the frontend doesn't ask for a specific set - see ListMyWorklogQueryHandler). */
    WorklogPage findAllByUserIdsAndDateBetween(Set<UUID> userIds, LocalDate startDate, LocalDate endDate, int page, int limit);

    record WorklogPage(List<WorklogEntryAggregate> items, long total) {
    }
}
