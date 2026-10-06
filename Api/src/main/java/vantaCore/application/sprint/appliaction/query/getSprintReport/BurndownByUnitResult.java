package vantaCore.application.sprint.appliaction.query.getSprintReport;

import java.util.List;

public record BurndownByUnitResult(String unit, List<BurndownPointResult> points) {
}
