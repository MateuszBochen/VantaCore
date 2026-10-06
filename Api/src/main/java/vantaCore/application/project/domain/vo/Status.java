package vantaCore.application.project.domain.vo;

import java.util.UUID;

/** Project-level, shared - just identity (name/color/isDone). Which issue types use it, and what it
 can transition to within a given type, is owned by that type's own WorkflowStep, not here - see the
 "Statuses are project-level and shared" ADR on the Status & Workflow Model sub-project. */
public record Status(
    UUID id,
    String name,
    String color,
    boolean isDone
) {
    public Status {
        if (id == null) {
            throw new IllegalArgumentException("Status id cannot be null");
        }
    }
}
