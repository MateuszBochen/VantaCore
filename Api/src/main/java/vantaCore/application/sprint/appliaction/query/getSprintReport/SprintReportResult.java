package vantaCore.application.sprint.appliaction.query.getSprintReport;

import java.util.List;
import java.util.UUID;

/** Not to be confused with SprintAggregate's own persisted `report` field (a point-in-time
 snapshot taken at close - see SprintReportEntry). ticketStatusTransitions is live-computed on
 read; burndownByUnit reads the recorded daily history (see SprintBurndownRepositoryInterface). */
public record SprintReportResult(
    UUID sprintId,
    List<TicketStatusTransitionCountResult> ticketStatusTransitions,
    List<BurndownByUnitResult> burndownByUnit
) {
}
