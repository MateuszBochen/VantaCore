package vantaCore.application.sprint.infrastructure.persistence.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vantaCore.application.sprint.domain.repository.SprintBurndownRepositoryInterface;
import vantaCore.application.sprint.infrastructure.persistence.entity.SprintBurndownPointEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public class JpaSprintBurndownRepositoryAdapter implements SprintBurndownRepositoryInterface {

    private final SpringDataSprintBurndownRepositoryInterface repository;

    @PersistenceContext
    private EntityManager entityManager;

    public JpaSprintBurndownRepositoryAdapter(SpringDataSprintBurndownRepositoryInterface repository) {
        this.repository = repository;
    }

    // Native upsert (not find-then-save) so recomputing "today" repeatedly - once from the daily
    // cron, any number of times more from reactive ticket-change events - can't race into a
    // duplicate row for the same (sprint_id, unit, date); the DB-level unique constraint (see
    // V24__create_sprint_burndown_points.sql) is what makes ON CONFLICT possible here.
    @Override
    @Transactional
    public void upsertPoint(UUID sprintId, String unit, LocalDate date, double remaining) {
        this.entityManager.createNativeQuery(
                "INSERT INTO sprint_burndown_points (id, sprint_id, unit, date, remaining) "
                    + "VALUES (?1, ?2, ?3, ?4, ?5) "
                    + "ON CONFLICT (sprint_id, unit, date) DO UPDATE SET remaining = EXCLUDED.remaining"
            )
            .setParameter(1, UUID.randomUUID())
            .setParameter(2, sprintId)
            .setParameter(3, unit)
            .setParameter(4, date)
            .setParameter(5, remaining)
            .executeUpdate();
    }

    @Override
    public List<BurndownPoint> findAllBySprintId(UUID sprintId) {
        return this.repository.findAllBySprintId(sprintId).stream()
            .map(entity -> new BurndownPoint(entity.getUnit(), entity.getDate(), entity.getRemaining()))
            .toList();
    }
}
