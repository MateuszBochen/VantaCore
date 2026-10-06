package vantaCore.application.release.appliaction.command.assignTicketToReleaseVersion;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// Internal command, no @RequiresResource - only ever dispatched from another handler (the
// automation engine's ASSIGN_NEXT_VERSION action executor), never reachable from a controller.
// Same shape as PropagateTimeSpentCommand: flat @NotNull fields, no request DTO to wrap.
final public class AssignTicketToReleaseVersionCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    public AssignTicketToReleaseVersionCommand(UUID projectId, UUID ticketId) {
        this.projectId = projectId;
        this.ticketId = ticketId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }
}
