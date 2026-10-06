package vantaCore.application.sprint.domain.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SprintBurndownRepositoryInterface {

    /** Insert-or-replace the (sprintId, unit, date) point - a date is only ever recorded once per
     unit; recomputing "today" overwrites, past days are otherwise never touched again. */
    void upsertPoint(UUID sprintId, String unit, LocalDate date, double remaining);

    /** Every recorded point for this sprint, unordered - callers group/sort by unit as needed. */
    List<BurndownPoint> findAllBySprintId(UUID sprintId);

    record BurndownPoint(String unit, LocalDate date, double remaining) {
    }
}
