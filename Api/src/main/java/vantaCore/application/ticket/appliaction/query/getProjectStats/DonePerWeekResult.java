package vantaCore.application.ticket.appliaction.query.getProjectStats;

import java.time.LocalDate;

/** weekStart is always a Monday - see JpaProjectStatsRepositoryAdapter. */
public record DonePerWeekResult(LocalDate weekStart, long count) {
}
