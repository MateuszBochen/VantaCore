package vantaCore.application.project.domain.repository;

import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.project.domain.vo.ProjectName;
import vantaCore.application.project.domain.vo.ProjectPrefix;

import java.util.List;
import java.util.Optional;

public interface ProjectAggregateRepositoryInterface {

    /** saving aggregate (create or full replace) */
    void save(ProjectAggregate project);

    /** getting aggregate */
    Optional<ProjectAggregate> findById(ProjectId id);

    /** lightweight id+name projection of every project */
    List<ProjectSummary> findAllSummaries();

    /** true if another project already uses this name */
    boolean existsByNameIgnoreCaseAndIdNot(ProjectName name, ProjectId excludeId);

    /** true if another project already uses this prefix */
    boolean existsByPrefixIgnoreCaseAndIdNot(ProjectPrefix prefix, ProjectId excludeId);

    /**
     * Atomically increments and returns the project's ticket-numbering counter (for ticket key
     * generation, e.g. "VC-1000"). Deliberately not part of ProjectAggregate - see the comment on the
     * next_ticket_number column in V4__add_project_next_ticket_number.sql for why.
     */
    int incrementAndGetNextTicketNumber(ProjectId id);

    /**
     * Re-seeds the ticket-numbering counter from startingNumber. Only meaningful while the project
     * has no tickets yet - UpsertProjectPolicy blocks startingNumber changes once it does, so this
     * becomes a no-op in practice after the first ticket exists.
     */
    void resetNextTicketNumber(ProjectId id, int startingNumber);

    record ProjectSummary(ProjectId id, String name) {
    }
}
