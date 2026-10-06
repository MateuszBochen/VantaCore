package vantaCore.application.sprint.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDate;
import java.util.UUID;

// Surrogate UUID id (rather than a composite (sprintId, unit, date) key) to match every other
// entity in this codebase - the DB-level unique constraint is what actually enforces "one row per
// sprint/unit/date", see the ON CONFLICT upsert in JpaSprintBurndownRepositoryAdapter.
@Entity
@Table(
    name = "sprint_burndown_points",
    uniqueConstraints = @UniqueConstraint(columnNames = {"sprint_id", "unit", "date"})
)
public class SprintBurndownPointEntity {

    @Id
    private UUID id;

    @Column(name = "sprint_id", nullable = false)
    private UUID sprintId;

    @Column(nullable = false)
    private String unit;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private double remaining;

    // Hibernate requires it
    protected SprintBurndownPointEntity() {}

    public UUID getSprintId() {
        return sprintId;
    }

    public String getUnit() {
        return unit;
    }

    public LocalDate getDate() {
        return date;
    }

    public double getRemaining() {
        return remaining;
    }
}
