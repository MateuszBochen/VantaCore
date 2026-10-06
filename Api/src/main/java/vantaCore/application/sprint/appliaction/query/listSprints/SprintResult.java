package vantaCore.application.sprint.appliaction.query.listSprints;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SprintResult(
    UUID id,
    UUID boardId,
    String name,
    LocalDate startDate,
    LocalDate endDate,
    String status,
    List<SprintTicketResult> tickets,
    Instant startedAt,
    UUID startedByUserId,
    Instant closedAt,
    UUID closedByUserId,
    List<SprintReportEntryResult> report,
    List<EstimateUnitValueResult> initialEstimateUnit,
    List<EstimateUnitValueResult> closingEstimateUnit,
    List<EstimateUnitValueResult> actualEstimateUnit
) {
}
