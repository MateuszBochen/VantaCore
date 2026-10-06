package vantaCore.application.sprint.domain.repository;

import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.vo.SprintId;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SprintAggregateRepositoryInterface {

    /** saving aggregate (create or full replace) */
    void save(SprintAggregate sprint);

    Optional<SprintAggregate> findById(SprintId id);

    /**
     * All sprints for a board, newest startDate first. from/till are an optional inclusive filter on
     * startDate - either or both may be null.
     */
    List<SprintAggregate> findAllByBoardId(UUID boardId, LocalDate from, LocalDate till);

    /**
     * Sprints for this board that aren't CLOSED, excluding excludeId (the sprint being saved, so it
     * doesn't collide with itself) - used for both the overlap check and the "only one active sprint"
     * check.
     */
    List<SprintAggregate> findAllOpenByBoardIdExcludingId(UUID boardId, SprintId excludeId);

    /** Every ACTIVE sprint that currently contains this ticket, across every board - used by the
     Ticket module to enforce allowEditTicketInActiveSprint/allowChangeEstimateInActiveSprint.
     Usually 0 or 1 result, but nothing stops the same ticket being planned into two different
     boards' sprints at once, so callers must handle more than one. */
    List<SprintAggregate> findAllActiveByTicketId(UUID ticketId);

    /** Every ACTIVE or FUTURE sprint that currently contains this ticket, across every board - used
     by GetTicketResult/TicketResultAssembler to surface "which sprint is this ticket in" on a
     ticket read. Unlike findAllActiveByTicketId, also matches a not-yet-started sprint the ticket
     was planned into; excludes CLOSED sprints since those are history, not a current placement.
     Usually 0 or 1 result - see findAllActiveByTicketId's javadoc for why callers can't assume that. */
    List<SprintAggregate> findAllOpenByTicketId(UUID ticketId);

    /** Every currently ACTIVE sprint, across every board - used by the daily burndown cron
     (SprintBurndownScheduler) to know which sprints still need a point recorded. */
    List<SprintAggregate> findAllActive();
}
