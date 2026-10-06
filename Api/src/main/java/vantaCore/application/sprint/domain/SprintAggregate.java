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

public class SprintAggregate {
    private final SprintId id;
    private final UUID boardId;
    private final String name;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final SprintStatus status;
    private final Set<UUID> ticketIds;
    private final Instant startedAt;
    private final UUID startedByUserId;
    private final Instant closedAt;
    private final UUID closedByUserId;
    private final List<SprintReportEntry> report;
    private final List<EstimateUnitValue> initialEstimateUnit;
    private final List<EstimateUnitValue> closingEstimateUnit;
    private final List<EstimateUnitValue> actualEstimateUnit;

    private SprintAggregate(
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
        this.id = id;
        this.boardId = boardId;
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.ticketIds = ticketIds == null ? Set.of() : Set.copyOf(ticketIds);
        this.startedAt = startedAt;
        this.startedByUserId = startedByUserId;
        this.closedAt = closedAt;
        this.closedByUserId = closedByUserId;
        this.report = report == null ? List.of() : List.copyOf(report);
        this.initialEstimateUnit = initialEstimateUnit == null ? List.of() : List.copyOf(initialEstimateUnit);
        this.closingEstimateUnit = closingEstimateUnit == null ? List.of() : List.copyOf(closingEstimateUnit);
        this.actualEstimateUnit = actualEstimateUnit == null ? List.of() : List.copyOf(actualEstimateUnit);
    }

    /** A brand-new sprint (always FUTURE, no start/close data yet) - also used to rebuild one from
     storage, since every field is supplied either way. */
    public static SprintAggregate newSprint(
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
        return new SprintAggregate(
            id, boardId, name, startDate, endDate, status, ticketIds,
            startedAt, startedByUserId, closedAt, closedByUserId, report,
            initialEstimateUnit, closingEstimateUnit, actualEstimateUnit
        );
    }

    /** Replaces this sprint's editable planning fields - id/boardId/status and the start/close
     bookkeeping fields (incl. all three estimate-unit snapshots) are fixed by this operation and
     always carry over from the current instance, never from the caller. Status transitions only
     happen through startSprint/closeSprint; a mid-active-sprint ticket-set change that should
     refresh actualEstimateUnit is a separate updateActualEstimateUnit() call on the result. */
    public SprintAggregate changeSprint(
        String name,
        LocalDate startDate,
        LocalDate endDate,
        Set<UUID> ticketIds
    ) {
        return new SprintAggregate(
            this.id, this.boardId, name, startDate, endDate, this.status, ticketIds,
            this.startedAt, this.startedByUserId, this.closedAt, this.closedByUserId, this.report,
            this.initialEstimateUnit, this.closingEstimateUnit, this.actualEstimateUnit
        );
    }

    /** FUTURE -> ACTIVE. Captures the sprint's starting scope (initialEstimateUnit) and seeds
     actualEstimateUnit from whatever's already done at that moment. */
    public SprintAggregate startSprint(
        Instant startedAt,
        UUID startedByUserId,
        List<EstimateUnitValue> initialEstimateUnit,
        List<EstimateUnitValue> actualEstimateUnit
    ) {
        return new SprintAggregate(
            this.id, this.boardId, this.name, this.startDate, this.endDate, SprintStatus.ACTIVE, this.ticketIds,
            startedAt, startedByUserId, this.closedAt, this.closedByUserId, this.report,
            initialEstimateUnit, this.closingEstimateUnit, actualEstimateUnit
        );
    }

    /** ACTIVE -> CLOSED, recording the report snapshot and the closing/final-actual estimate
     totals taken at close time. */
    public SprintAggregate closeSprint(
        Instant closedAt,
        UUID closedByUserId,
        List<SprintReportEntry> report,
        List<EstimateUnitValue> closingEstimateUnit,
        List<EstimateUnitValue> actualEstimateUnit
    ) {
        return new SprintAggregate(
            this.id, this.boardId, this.name, this.startDate, this.endDate, SprintStatus.CLOSED, this.ticketIds,
            this.startedAt, this.startedByUserId, closedAt, closedByUserId, report,
            this.initialEstimateUnit, closingEstimateUnit, actualEstimateUnit
        );
    }

    /** Refreshes actualEstimateUnit in place - used whenever the set of done tickets (or the
     sprint's ticket set) changes while it's ACTIVE. Everything else carries over unchanged. */
    public SprintAggregate updateActualEstimateUnit(List<EstimateUnitValue> actualEstimateUnit) {
        return new SprintAggregate(
            this.id, this.boardId, this.name, this.startDate, this.endDate, this.status, this.ticketIds,
            this.startedAt, this.startedByUserId, this.closedAt, this.closedByUserId, this.report,
            this.initialEstimateUnit, this.closingEstimateUnit, actualEstimateUnit
        );
    }

    public SprintSnapshot toSnapshot() {
        return new SprintSnapshot(
            id, boardId, name, startDate, endDate, status, ticketIds,
            startedAt, startedByUserId, closedAt, closedByUserId, report,
            initialEstimateUnit, closingEstimateUnit, actualEstimateUnit
        );
    }
}
