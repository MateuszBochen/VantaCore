package vantaCore.application.release.infrastructure.persistence.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vantaCore.application.release.domain.ReleaseAggregate;
import vantaCore.application.release.domain.repository.ReleaseAggregateRepositoryInterface;
import vantaCore.application.release.domain.vo.ReleaseId;
import vantaCore.application.release.infrastructure.persistence.entity.ReleaseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaReleaseRepositoryAdapter implements ReleaseAggregateRepositoryInterface {

    private final SpringDataReleaseRepositoryInterface repository;

    @PersistenceContext
    private EntityManager entityManager;

    public JpaReleaseRepositoryAdapter(SpringDataReleaseRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(ReleaseAggregate release) {
        this.repository.save(ReleaseEntity.fromDomain(release));
    }

    @Override
    public Optional<ReleaseAggregate> findById(ReleaseId id) {
        return this.repository.findById(id.value()).map(ReleaseEntity::toDomain);
    }

    @Override
    public List<ReleaseAggregate> findAllByProjectId(UUID projectId) {
        return this.repository.findAllByProjectIdOrderByPlannedReleaseDateDesc(projectId).stream()
            .map(ReleaseEntity::toDomain)
            .toList();
    }

    @Override
    public ReleasePage findPageByProjectId(UUID projectId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "plannedReleaseDate"));
        Page<ReleaseEntity> result = this.repository.findAllByProjectId(projectId, pageable);

        return new ReleasePage(
            result.getContent().stream().map(ReleaseEntity::toDomain).toList(),
            result.getTotalElements()
        );
    }

    @Override
    public ReleasePage findPage(int page, int limit, LocalDate from, LocalDate till) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "plannedReleaseDate"));
        Page<ReleaseEntity> result = this.repository.findAllInRange(from, till, pageable);

        return new ReleasePage(
            result.getContent().stream().map(ReleaseEntity::toDomain).toList(),
            result.getTotalElements()
        );
    }

    @Override
    @Transactional
    public void addTicket(ReleaseId releaseId, UUID ticketId) {
        this.entityManager.createNativeQuery(
                "INSERT INTO release_tickets (release_id, ticket_id) VALUES (?1, ?2) ON CONFLICT (release_id, ticket_id) DO NOTHING"
            )
            .setParameter(1, releaseId.value())
            .setParameter(2, ticketId)
            .executeUpdate();
    }
}
