package vantaCore.application.ticket.domain.repository;

import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketKey;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface TicketAggregateRepositoryInterface {

    /** saving aggregate (create or full replace) */
    void save(TicketAggregate ticket);

    /** getting aggregate */
    Optional<TicketAggregate> findById(TicketId id);

    /** key is only unique within a project, hence the projectId scoping (see tickets_project_id_key_key) */
    Optional<TicketAggregate> findByProjectIdAndKey(UUID projectId, TicketKey key);

    /** true if this project has at least one ticket - used to lock prefix/startingNumber once numbering is live */
    boolean existsByProjectId(UUID projectId);

    /** direct children only (ticket.parentId == this id), not the whole descendant tree */
    List<TicketAggregate> findAllByParentId(TicketId parentId);

    /** bulk full-aggregate fetch (vs. findProjectIdsByIds' lightweight id->projectId map) - ids
     with no matching ticket are simply absent from the result, not an error. */
    List<TicketAggregate> findAllByIds(Set<UUID> ids);

    /** bulk id -> projectId lookup (e.g. resolving a sprint's ticket ids into project-scoped links)
     - ids with no matching ticket are simply absent from the result, not an error. */
    Map<UUID, UUID> findProjectIdsByIds(Set<UUID> ticketIds);

    /**
     * Paginated (0-indexed page, page size = limit), newest first. parentId is an optional filter -
     * null means root tickets only (no parent), non-null means direct children of that ticket. There
     * is no "every ticket regardless of hierarchy level" mode.
     */
    TicketPage findAllByProjectId(UUID projectId, UUID parentId, int page, int limit);

    /** own worklog time only - see PropagateTimeSpentCommandHandler */
    void incrementTimeSpent(TicketId id, int deltaMinutes);

    /** own + every descendant's worklog time - see PropagateTimeSpentCommandHandler */
    void incrementTimeSpentAll(TicketId id, int deltaMinutes);

    /** own + every descendant's estimate - see PropagateEstimateCommandHandler */
    void incrementEstimateAll(TicketId id, double deltaEstimate);

    /** Recursive, weighted progress rollup - see PropagateProgressCommandHandler. null clears it
     back to "no children" (leaf) semantics; TicketResultAssembler.computeProgress is the only
     reader. */
    void updateProgress(TicketId id, Integer progress);

    /** overwrites custom_fields_search_text (see CustomFieldSearchTextMapper) - deliberately not
     part of the normal save() round-trip, same reasoning as time_spent_all/estimate_all. */
    void updateCustomFieldsSearchText(TicketId id, String searchText);

    /** Every ticket in the project matching the given filters (empty set = no filter on that
     dimension), oldest first - backs CSV/ZIP ticket export. Unpaginated, unlike findAllByProjectId:
     an export needs every matching row in one pass, not a page at a time. */
    List<TicketAggregate> findAllByProjectIdAndFilters(UUID projectId, Set<UUID> issueTypeIds, Set<UUID> statusIds);

    /** every distinct tag currently used by any ticket in this project, alphabetical - lets the
     frontend suggest existing tags instead of letting free text drift into near-duplicates/typos. */
    List<String> findAllDistinctTags(UUID projectId);

    TicketRollup findRollup(TicketId id);

    /** Every ticket (in any project) whose relatedTickets references this ticket id - used to clean
     up the OTHER side of a relation before hard-deleting a ticket (see DeleteTicketCommandHandler);
     UpsertTicketCommandHandler's own PUT-time sync (syncInverseRelations) only ever touches the
     handful of ids in the request it's handling, it has no reason to search for this. */
    List<TicketAggregate> findAllRelatingTo(UUID ticketId);

    /** Hard-deletes this ticket AND every row in every table that references it (comments, worklog
     entries, ticket history, test cases, its own assignee/flag/tag element collections, and its
     sprint/release membership rows) - see JpaTicketRepositoryAdapter for the exact table list. Does
     NOT touch other tickets' relatedTickets (see findAllRelatingTo) or ancestors' timeSpentAll/
     estimateAll/progress rollups (see PropagateTimeSpentCommand/PropagateEstimateCommand/
     PropagateProgressCommand) - those are the caller's responsibility, same "narrow, mechanical
     persistence op vs. domain-level side effect"
     split as every other method here. Callers must have already verified this ticket has no
     children (findAllByParentId) - deleting one that still has children would silently orphan
     their parentId, since that column has no FK. */
    void deleteById(TicketId id);

    /** Tickets of the project currently in any of these statuses - ids only, for bulk reactions
     (e.g. which active sprints are affected by a status' isDone flag changing). */
    Set<UUID> findIdsByProjectIdAndStatusIds(UUID projectId, Set<UUID> statusIds);

    /** Bulk doneAt sync after a status' isDone flag changed in project settings - the same rule as
     TicketAggregate.resolveDoneAt, applied without loading every ticket: tickets in a now-done
     status get doneAt = their changedAt (the best "became done" approximation available) unless
     they already have one; tickets in a now-not-done status get it cleared. Single-column atomic
     UPDATEs, same reasoning as incrementTimeSpent etc. */
    void markDoneAtForStatuses(UUID projectId, Set<UUID> statusIds);

    void clearDoneAtForStatuses(UUID projectId, Set<UUID> statusIds);

    record TicketRollup(int timeSpent, int timeSpentAll, double estimateAll, Integer progress) {
    }

    record TicketPage(List<TicketAggregate> items, long total) {
    }
}
