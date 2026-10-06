package vantaCore.application.sprint.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.sprint.domain.vo.SprintId;
import vantaCore.application.sprint.infrastructure.persistence.entity.SprintEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaSprintRepositoryAdapter implements SprintAggregateRepositoryInterface {

    private final SpringDataSprintRepositoryInterface repository;

    public JpaSprintRepositoryAdapter(SpringDataSprintRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(SprintAggregate sprint) {
        this.repository.save(SprintEntity.fromDomain(sprint));
    }

    @Override
    public Optional<SprintAggregate> findById(SprintId id) {
        return this.repository.findById(id.value()).map(SprintEntity::toDomain);
    }

    @Override
    public List<SprintAggregate> findAllByBoardId(UUID boardId, LocalDate from, LocalDate till) {
        return this.repository.findAllByBoardId(boardId, from, till).stream()
            .map(SprintEntity::toDomain)
            .toList();
    }

    @Override
    public List<SprintAggregate> findAllOpenByBoardIdExcludingId(UUID boardId, SprintId excludeId) {
        return this.repository.findAllOpenByBoardIdExcludingId(boardId, excludeId != null ? excludeId.value() : null).stream()
            .map(SprintEntity::toDomain)
            .toList();
    }

    @Override
    public List<SprintAggregate> findAllActiveByTicketId(UUID ticketId) {
        return this.repository.findAllActiveByTicketId(ticketId).stream()
            .map(SprintEntity::toDomain)
            .toList();
    }

    @Override
    public List<SprintAggregate> findAllOpenByTicketId(UUID ticketId) {
        return this.repository.findAllOpenByTicketId(ticketId).stream()
            .map(SprintEntity::toDomain)
            .toList();
    }

    @Override
    public List<SprintAggregate> findAllActive() {
        return this.repository.findAllActive().stream()
            .map(SprintEntity::toDomain)
            .toList();
    }
}
