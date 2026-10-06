package vantaCore.application.auditLog.infrastructure.persistence.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.stereotype.Repository;
import vantaCore.application.auditLog.domain.AuditLogEntry;
import vantaCore.application.auditLog.domain.repository.AuditLogEntryRepositoryInterface;
import vantaCore.application.auditLog.infrastructure.persistence.entity.AuditLogEntryEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// Optional filters are built with the JPA Criteria API rather than a "(:x IS NULL OR field = :x)"
// native-SQL pattern - a predicate is only added to the query when its filter is actually present,
// so there's no equivalent of the null-parameter-type ambiguity that pattern hit elsewhere in this
// codebase (see the search module's SqlBuilder for that precedent, native SQL there instead because
// full-text tsquery/ts_rank isn't expressible via Criteria).
@Repository
public class JpaAuditLogEntryRepositoryAdapter implements AuditLogEntryRepositoryInterface {

    private final SpringDataAuditLogEntryRepositoryInterface repository;

    @PersistenceContext
    private EntityManager entityManager;

    public JpaAuditLogEntryRepositoryAdapter(SpringDataAuditLogEntryRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(AuditLogEntry entry) {
        this.repository.save(AuditLogEntryEntity.fromDomain(entry));
    }

    @Override
    public AuditLogPage findAllByProjectId(UUID projectId, AuditLogFilter filter, int page, int limit) {
        CriteriaBuilder cb = this.entityManager.getCriteriaBuilder();

        CriteriaQuery<AuditLogEntryEntity> query = cb.createQuery(AuditLogEntryEntity.class);
        Root<AuditLogEntryEntity> root = query.from(AuditLogEntryEntity.class);
        query.select(root)
            .where(buildPredicates(cb, root, projectId, filter))
            .orderBy(cb.desc(root.get("occurredAt")));

        List<AuditLogEntryEntity> rows = this.entityManager.createQuery(query)
            .setFirstResult(page * limit)
            .setMaxResults(limit)
            .getResultList();

        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<AuditLogEntryEntity> countRoot = countQuery.from(AuditLogEntryEntity.class);
        countQuery.select(cb.count(countRoot)).where(buildPredicates(cb, countRoot, projectId, filter));
        long total = this.entityManager.createQuery(countQuery).getSingleResult();

        return new AuditLogPage(rows.stream().map(AuditLogEntryEntity::toDomain).toList(), total);
    }

    private Predicate[] buildPredicates(CriteriaBuilder cb, Root<AuditLogEntryEntity> root, UUID projectId, AuditLogFilter filter) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.equal(root.get("projectId"), projectId));

        if (filter.actorId() != null) {
            predicates.add(cb.equal(root.get("actorId"), filter.actorId()));
        }
        if (filter.resourceType() != null) {
            predicates.add(cb.equal(root.get("resourceType"), filter.resourceType()));
        }
        if (filter.action() != null) {
            predicates.add(cb.equal(root.get("action"), filter.action()));
        }
        if (filter.from() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), filter.from()));
        }
        if (filter.till() != null) {
            predicates.add(cb.lessThan(root.get("occurredAt"), filter.till()));
        }

        return predicates.toArray(new Predicate[0]);
    }
}
