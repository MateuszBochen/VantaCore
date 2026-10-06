package vantaCore.application.worklog.infrastructure.persistence.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import vantaCore.application.worklog.domain.WorklogEntryAggregate;
import vantaCore.application.worklog.domain.repository.WorklogEntryAggregateRepositoryInterface;
import vantaCore.application.worklog.domain.vo.WorklogEntryId;
import vantaCore.application.worklog.infrastructure.persistence.entity.WorklogEntryEntity;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public class JpaWorklogEntryRepositoryAdapter implements WorklogEntryAggregateRepositoryInterface {

    private final SpringDataWorklogEntryRepositoryInterface repository;

    public JpaWorklogEntryRepositoryAdapter(SpringDataWorklogEntryRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(WorklogEntryAggregate entry) {
        this.repository.save(WorklogEntryEntity.fromDomain(entry));
    }

    @Override
    public Optional<WorklogEntryAggregate> findById(WorklogEntryId id) {
        return this.repository.findById(id.value()).map(WorklogEntryEntity::toDomain);
    }

    @Override
    public List<WorklogEntryAggregate> findAllByTicketId(UUID ticketId) {
        return this.repository.findAllByTicketIdOrderByCreatedAtDesc(ticketId).stream()
            .map(WorklogEntryEntity::toDomain)
            .toList();
    }

    @Override
    public void deleteById(WorklogEntryId id) {
        this.repository.deleteById(id.value());
    }

    @Override
    public WorklogPage findAllByUserIdsAndDateBetween(Set<UUID> userIds, LocalDate startDate, LocalDate endDate, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit);

        // The entry's own date/time is a LocalDateTime column; startDate/endDate here are just the
        // (date-only) filter boundaries, widened to cover the whole day on each end.
        Page<WorklogEntryEntity> result = this.repository.findAllByUserIdInAndDateBetweenOrderByDateDescCreatedAtDesc(
            userIds, startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX), pageable
        );

        return new WorklogPage(
            result.getContent().stream().map(WorklogEntryEntity::toDomain).toList(),
            result.getTotalElements()
        );
    }
}
