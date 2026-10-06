package vantaCore.application.sprint.domain;

import vantaCore.application.sprint.domain.vo.EstimateUnitValue;
import vantaCore.application.sprint.domain.vo.SprintId;
import vantaCore.application.sprint.domain.vo.SprintReportEntry;
import vantaCore.application.sprint.domain.vo.SprintStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Read-only view of a SprintAggregate's state - the only way anything outside the aggregate gets
 at its fields, since SprintAggregate itself exposes no getters. */
public record SprintSnapshot(
    SprintId id,
    UUID boardId,
    String name,
    LocalDate startDate,
    LocalDate endDate,
    SprintStatus status,
    Set<UUID> ticketIds,
    Instant startedAt,
    UUID startedByUserId,
    Instant closedAt,
    UUID closedByUserId,
    List<SprintReportEntry> report,
    List<EstimateUnitValue> initialEstimateUnit,
    List<EstimateUnitValue> closingEstimateUnit,
    List<EstimateUnitValue> actualEstimateUnit
) {
}
