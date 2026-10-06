package vantaCore.application.ticket.infrastructure.persistence.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketKey;
import vantaCore.application.ticket.infrastructure.persistence.entity.TicketEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class JpaTicketRepositoryAdapter implements TicketAggregateRepositoryInterface {

    private final SpringDataTicketRepositoryInterface repository;

    @PersistenceContext
    private EntityManager entityManager;

    public JpaTicketRepositoryAdapter(SpringDataTicketRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(TicketAggregate ticket) {
        this.repository.save(TicketEntity.fromDomain(ticket));
    }

    @Override
    public Optional<TicketAggregate> findById(TicketId id) {
        return this.repository.findById(id.value()).map(TicketEntity::toDomain);
    }

    @Override
    public Optional<TicketAggregate> findByProjectIdAndKey(UUID projectId, TicketKey key) {
        return this.repository.findByProjectIdAndKey(projectId, key.value()).map(TicketEntity::toDomain);
    }

    @Override
    public boolean existsByProjectId(UUID projectId) {
        return this.repository.existsByProjectId(projectId);
    }

    @Override
    public List<TicketAggregate> findAllByParentId(TicketId parentId) {
        return this.repository.findAllByParentId(parentId.value()).stream()
            .map(TicketEntity::toDomain)
            .toList();
    }

    @Override
    public List<TicketAggregate> findAllByIds(Set<UUID> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }

        return this.repository.findAllById(ids).stream()
            .map(TicketEntity::toDomain)
            .toList();
    }

    @Override
    public Map<UUID, UUID> findProjectIdsByIds(Set<UUID> ticketIds) {
        if (ticketIds.isEmpty()) {
            return Map.of();
        }

        return this.repository.findAllByIdIn(ticketIds).stream()
            .collect(Collectors.toMap(TicketIdAndProjectIdProjection::getId, TicketIdAndProjectIdProjection::getProjectId));
    }

    @Override
    public TicketPage findAllByProjectId(UUID projectId, UUID parentId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<TicketEntity> result = parentId != null
            ? this.repository.findAllByProjectIdAndParentId(projectId, parentId, pageable)
            : this.repository.findAllByProjectIdAndParentIdIsNull(projectId, pageable);

        return new TicketPage(
            result.getContent().stream().map(TicketEntity::toDomain).toList(),
            result.getTotalElements()
        );
    }

    // Criteria API rather than derived query methods, since issueTypeIds/statusIds are each
    // independently optional - a predicate is only added when its set is non-empty, avoiding the
    // native-SQL null-parameter-type ambiguity the search module's SqlBuilder was built to dodge
    // (see JpaAuditLogEntryRepositoryAdapter for the same reasoning applied to a different table).
    @Override
    public List<TicketAggregate> findAllByProjectIdAndFilters(UUID projectId, Set<UUID> issueTypeIds, Set<UUID> statusIds) {
        CriteriaBuilder cb = this.entityManager.getCriteriaBuilder();
        CriteriaQuery<TicketEntity> query = cb.createQuery(TicketEntity.class);
        Root<TicketEntity> root = query.from(TicketEntity.class);

        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.equal(root.get("projectId"), projectId));

        if (issueTypeIds != null && !issueTypeIds.isEmpty()) {
            predicates.add(root.get("issueTypeId").in(issueTypeIds));
        }
        if (statusIds != null && !statusIds.isEmpty()) {
            predicates.add(root.get("statusId").in(statusIds));
        }

        query.select(root).where(predicates.toArray(new Predicate[0]))
            .orderBy(cb.asc(root.get("createdAt")));

        return this.entityManager.createQuery(query).getResultList().stream().map(TicketEntity::toDomain).toList();
    }

    // See V7__add_ticket_time_spent.sql - time_spent/time_spent_all are intentionally unmapped in
    // TicketEntity, so these go straight through EntityManager instead of the normal save() path.
    @Override
    @Transactional
    public void incrementTimeSpent(TicketId id, int deltaMinutes) {
        this.entityManager.createNativeQuery("UPDATE tickets SET time_spent = time_spent + ?1 WHERE id = ?2")
            .setParameter(1, deltaMinutes)
            .setParameter(2, id.value())
            .executeUpdate();
    }

    @Override
    @Transactional
    public void incrementTimeSpentAll(TicketId id, int deltaMinutes) {
        this.entityManager.createNativeQuery("UPDATE tickets SET time_spent_all = time_spent_all + ?1 WHERE id = ?2")
            .setParameter(1, deltaMinutes)
            .setParameter(2, id.value())
            .executeUpdate();
    }

    // See V13__add_ticket_estimate_all.sql - same reasoning as time_spent_all.
    @Override
    @Transactional
    public void incrementEstimateAll(TicketId id, double deltaEstimate) {
        this.entityManager.createNativeQuery("UPDATE tickets SET estimate_all = estimate_all + ?1 WHERE id = ?2")
            .setParameter(1, deltaEstimate)
            .setParameter(2, id.value())
            .executeUpdate();
    }

    // See V48__add_ticket_progress_rollup.sql - overwrite, not increment (progress is a recomputed
    // average, not a running sum like time_spent_all/estimate_all). progress is legitimately null
    // here (a ticket that just lost its last child) - CAST(?1 AS integer), not the bare parameter,
    // since Postgres can't infer a bind parameter's type from a null value alone (same "explicit
    // CAST over a bare bound parameter" issue as JpaProjectStatsRepositoryAdapter's generate_series
    // query / the roadmap from/till filter).
    @Override
    @Transactional
    public void updateProgress(TicketId id, Integer progress) {
        this.entityManager.createNativeQuery("UPDATE tickets SET progress = CAST(?1 AS integer) WHERE id = ?2")
            .setParameter(1, progress)
            .setParameter(2, id.value())
            .executeUpdate();
    }

    // See V25__add_search_vectors.sql - custom_fields_search_text is maintained, not generated.
    @Override
    @Transactional
    public void updateCustomFieldsSearchText(TicketId id, String searchText) {
        this.entityManager.createNativeQuery("UPDATE tickets SET custom_fields_search_text = ?1 WHERE id = ?2")
            .setParameter(1, searchText)
            .setParameter(2, id.value())
            .executeUpdate();
    }

    @Override
    public List<String> findAllDistinctTags(UUID projectId) {
        return this.repository.findAllDistinctTagsByProjectId(projectId);
    }

    @Override
    public TicketRollup findRollup(TicketId id) {
        Object[] result = (Object[]) this.entityManager.createNativeQuery(
                "SELECT time_spent, time_spent_all, estimate_all, progress FROM tickets WHERE id = ?1"
            )
            .setParameter(1, id.value())
            .getSingleResult();

        return new TicketRollup(
            ((Number) result[0]).intValue(),
            ((Number) result[1]).intValue(),
            ((Number) result[2]).doubleValue(),
            result[3] == null ? null : ((Number) result[3]).intValue()
        );
    }

    // Jsonb containment (@>): matches any ticket whose related_tickets array has an element that is
    // a superset of {"relatedTicketId": "<id>"} - i.e. contains that key/value regardless of what
    // "type" is also on that element. Simpler and well-indexable-later than a jsonpath expression.
    @Override
    @SuppressWarnings("unchecked")
    public List<TicketAggregate> findAllRelatingTo(UUID ticketId) {
        String containsPattern = "[{\"relatedTicketId\":\"" + ticketId + "\"}]";

        List<UUID> ids = this.entityManager.createNativeQuery(
                "SELECT id FROM tickets WHERE related_tickets @> CAST(?1 AS jsonb)"
            )
            .setParameter(1, containsPattern)
            .getResultList();

        return findAllByIds(Set.copyOf(ids));
    }

    // No ON DELETE CASCADE anywhere in this schema (every FK to tickets defaults to RESTRICT) and
    // several join-style tables (sprint_tickets, release_tickets) have no FK at all - so every
    // table that references a ticket is cleaned up explicitly here, in dependency order, before the
    // ticket row itself. Does NOT touch other tickets' related_tickets or ancestors' rollups - see
    // this method's javadoc on the domain interface for why that's the caller's job.
    @Override
    @Transactional
    public void deleteById(TicketId id) {
        UUID ticketId = id.value();

        // The rows below go away via native SQL, which the persistence context knows nothing about -
        // and with open-in-view one context lives for the whole HTTP request. A TicketEntity already
        // loaded earlier in that request (e.g. a bulk delete checking which tickets exist, or a
        // cascade delete walking the subtree) would otherwise keep being served from the context
        // by findById after its row is gone. Detached up front so any later lookup hits the DB.
        TicketEntity managed = this.entityManager.find(TicketEntity.class, ticketId);
        if (managed != null) {
            this.entityManager.detach(managed);
        }

        this.entityManager.createNativeQuery(
                "DELETE FROM test_case_steps WHERE test_case_id IN (SELECT id FROM test_cases WHERE ticket_id = ?1)"
            )
            .setParameter(1, ticketId)
            .executeUpdate();

        deleteWhereTicketId("test_cases", ticketId);
        deleteWhereTicketId("comments", ticketId);
        deleteWhereTicketId("worklog_entries", ticketId);
        deleteWhereTicketId("ticket_history", ticketId);
        deleteWhereTicketId("ticket_assignees", ticketId);
        deleteWhereTicketId("ticket_flags", ticketId);
        deleteWhereTicketId("ticket_tags", ticketId);
        deleteWhereTicketId("sprint_tickets", ticketId);
        deleteWhereTicketId("release_tickets", ticketId);
        deleteWhereTicketId("development_activities", ticketId);

        deleteWhereTicketId("tickets", "id", ticketId);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Set<UUID> findIdsByProjectIdAndStatusIds(UUID projectId, Set<UUID> statusIds) {
        if (statusIds.isEmpty()) {
            return Set.of();
        }
        List<UUID> ids = this.entityManager.createNativeQuery(
                "SELECT id FROM tickets WHERE project_id = ?1 AND status_id IN (?2)"
            )
            .setParameter(1, projectId)
            .setParameter(2, statusIds)
            .getResultList();
        return Set.copyOf(ids);
    }

    @Override
    @Transactional
    public void markDoneAtForStatuses(UUID projectId, Set<UUID> statusIds) {
        if (statusIds.isEmpty()) {
            return;
        }
        this.entityManager.createNativeQuery(
                "UPDATE tickets SET done_at = changed_at WHERE project_id = ?1 AND status_id IN (?2) AND done_at IS NULL"
            )
            .setParameter(1, projectId)
            .setParameter(2, statusIds)
            .executeUpdate();
    }

    @Override
    @Transactional
    public void clearDoneAtForStatuses(UUID projectId, Set<UUID> statusIds) {
        if (statusIds.isEmpty()) {
            return;
        }
        this.entityManager.createNativeQuery(
                "UPDATE tickets SET done_at = NULL WHERE project_id = ?1 AND status_id IN (?2) AND done_at IS NOT NULL"
            )
            .setParameter(1, projectId)
            .setParameter(2, statusIds)
            .executeUpdate();
    }

    private void deleteWhereTicketId(String table, UUID ticketId) {
        deleteWhereTicketId(table, "ticket_id", ticketId);
    }

    private void deleteWhereTicketId(String table, String column, UUID ticketId) {
        this.entityManager.createNativeQuery("DELETE FROM " + table + " WHERE " + column + " = ?1")
            .setParameter(1, ticketId)
            .executeUpdate();
    }
}
