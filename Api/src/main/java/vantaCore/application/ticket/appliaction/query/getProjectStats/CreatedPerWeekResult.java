package vantaCore.application.ticket.appliaction.query.getProjectStats;

import java.time.LocalDate;

/** weekStart is always a Monday - see JpaProjectStatsRepositoryAdapter. */
public record CreatedPerWeekResult(LocalDate weekStart, long count) {
}
