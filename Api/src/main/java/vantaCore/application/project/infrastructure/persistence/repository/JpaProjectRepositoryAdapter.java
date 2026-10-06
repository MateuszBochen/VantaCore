package vantaCore.application.project.infrastructure.persistence.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.project.domain.vo.ProjectName;
import vantaCore.application.project.domain.vo.ProjectPrefix;
import vantaCore.application.project.infrastructure.persistence.entity.ProjectEntity;

import java.util.List;
import java.util.Optional;

@Repository
public class JpaProjectRepositoryAdapter implements ProjectAggregateRepositoryInterface {

    private final SpringDataProjectRepositoryInterface repository;

    @PersistenceContext
    private EntityManager entityManager;

    public JpaProjectRepositoryAdapter(SpringDataProjectRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(ProjectAggregate project) {
        ProjectEntity entity = ProjectEntity.fromDomain(project);
        this.repository.save(entity);
    }

    @Override
    public Optional<ProjectAggregate> findById(ProjectId id) {
        return this.repository.findById(id.value()).map(ProjectEntity::toDomain);
    }

    @Override
    public List<ProjectSummary> findAllSummaries() {
        return this.repository.findAllByOrderByNameAsc().stream()
            .map(projection -> new ProjectSummary(new ProjectId(projection.getId()), projection.getName()))
            .toList();
    }

    @Override
    public boolean existsByNameIgnoreCaseAndIdNot(ProjectName name, ProjectId excludeId) {
        return this.repository.existsByNameIgnoreCaseAndIdNot(name.value(), excludeId.value());
    }

    @Override
    public boolean existsByPrefixIgnoreCaseAndIdNot(ProjectPrefix prefix, ProjectId excludeId) {
        return this.repository.existsByPrefixIgnoreCaseAndIdNot(prefix.value(), excludeId.value());
    }

    // Neither CommandBus nor QueryBus actually run inside a Spring transaction today (see CLAUDE.md -
    // TransactionMiddleware exists but isn't registered as middleware), and a native UPDATE through
    // EntityManager requires one regardless of the statement being atomic at the DB level on its own -
    // so these two need their own explicit @Transactional rather than relying on one from the caller.
    @Override
    @Transactional
    public int incrementAndGetNextTicketNumber(ProjectId id) {
        Object result = this.entityManager.createNativeQuery(
                "UPDATE projects SET next_ticket_number = next_ticket_number + 1 WHERE id = ?1 RETURNING next_ticket_number"
            )
            .setParameter(1, id.value())
            .getSingleResult();

        return ((Number) result).intValue();
    }

    @Override
    @Transactional
    public void resetNextTicketNumber(ProjectId id, int startingNumber) {
        this.entityManager.createNativeQuery("UPDATE projects SET next_ticket_number = ?1 WHERE id = ?2")
            .setParameter(1, startingNumber)
            .setParameter(2, id.value())
            .executeUpdate();
    }
}
