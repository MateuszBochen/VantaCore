package vantaCore.application.ticket.appliaction.command.syncDoneAt;

import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

/** Internal, event-dispatched only (see SyncDoneAtWhenProjectStatusDoneFlagWasChanged) - never
 reachable from a controller, so no @RequiresResource. */
final public class SyncDoneAtForStatusesCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final Set<UUID> becameDoneStatusIds;

    @NotNull
    private final Set<UUID> becameNotDoneStatusIds;

    public SyncDoneAtForStatusesCommand(UUID projectId, Set<UUID> becameDoneStatusIds, Set<UUID> becameNotDoneStatusIds) {
        this.projectId = projectId;
        this.becameDoneStatusIds = becameDoneStatusIds;
        this.becameNotDoneStatusIds = becameNotDoneStatusIds;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public Set<UUID> getBecameDoneStatusIds() {
        return becameDoneStatusIds;
    }

    public Set<UUID> getBecameNotDoneStatusIds() {
        return becameNotDoneStatusIds;
    }
}
