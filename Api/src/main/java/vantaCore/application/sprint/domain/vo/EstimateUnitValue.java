package vantaCore.application.sprint.domain.vo;

/** One rolled-up total for a given estimate unit (e.g. "SP", "mandays") - a sprint can span
 boards with multiple projects, and each project has its own single estimate unit, so totals are
 kept as a per-unit breakdown rather than one unit-agnostic number. */
public record EstimateUnitValue(String unit, double value) {
    public EstimateUnitValue {
        if (unit == null || unit.isBlank()) {
            throw new IllegalArgumentException("EstimateUnitValue unit cannot be blank");
        }
    }
}
