package vantaCore.application.sprint.appliaction.command.recalculateActiveSprintEstimate;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** Internal, event-dispatched only (see RecalculateActualEstimateWhenTicketWasChanged) - never
 reachable directly from a controller, so no @RequiresResource. */
final public class RecalculateActiveSprintEstimateCommand {

    @NotNull
    private final UUID sprintId;

    public RecalculateActiveSprintEstimateCommand(UUID sprintId) {
        this.sprintId = sprintId;
    }

    public UUID getSprintId() {
        return sprintId;
    }
}
