package vantaCore.application.vcs.infrastructure.persistence.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vantaCore.application.vcs.domain.DevelopmentActivityAggregate;
import vantaCore.application.vcs.domain.repository.DevelopmentActivityRepositoryInterface;
import vantaCore.application.vcs.infrastructure.persistence.entity.DevelopmentActivityEntity;

import java.util.Optional;
import java.util.UUID;
import java.util.function.UnaryOperator;

@Repository
public class JpaDevelopmentActivityRepositoryAdapter implements DevelopmentActivityRepositoryInterface {

    private final SpringDataDevelopmentActivityRepositoryInterface repository;

    @PersistenceContext
    private EntityManager entityManager;

    public JpaDevelopmentActivityRepositoryAdapter(SpringDataDevelopmentActivityRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Optional<DevelopmentActivityAggregate> findByTicketId(UUID ticketId) {
        return this.repository.findById(ticketId).map(DevelopmentActivityEntity::toDomain);
    }

    // Neither CommandBus nor QueryBus runs inside a transaction by default (see CLAUDE.md), and a
    // lock held via EntityManager.find only lasts as long as the surrounding transaction - so this
    // whole read-lock-mutate-write cycle needs its own explicit @Transactional boundary, same
    // reasoning as the native-UPDATE methods on JpaProjectRepositoryAdapter. The insert-if-missing
    // step happens inside the same transaction so a second concurrent webhook for a brand-new
    // ticket can't race past it - it blocks on the row lock like every other case.
    @Override
    @Transactional
    public void update(UUID ticketId, UnaryOperator<DevelopmentActivityAggregate> mutation) {
        this.entityManager.createNativeQuery(
                "INSERT INTO development_activities (ticket_id, branches, commits, pull_requests, deployments) "
                    + "VALUES (?1, '[]', '[]', '[]', '[]') ON CONFLICT (ticket_id) DO NOTHING"
            )
            .setParameter(1, ticketId)
            .executeUpdate();

        DevelopmentActivityEntity locked = this.entityManager.find(
            DevelopmentActivityEntity.class, ticketId, LockModeType.PESSIMISTIC_WRITE
        );

        DevelopmentActivityAggregate current = locked.toDomain();
        DevelopmentActivityAggregate updated = mutation.apply(current);

        this.entityManager.merge(DevelopmentActivityEntity.fromDomain(updated));
    }
}
