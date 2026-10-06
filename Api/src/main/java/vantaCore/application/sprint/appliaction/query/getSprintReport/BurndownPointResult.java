package vantaCore.application.sprint.appliaction.query.getSprintReport;

import java.time.LocalDate;

public record BurndownPointResult(LocalDate date, double remaining) {
}
