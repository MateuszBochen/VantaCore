package vantaCore.application.vcs.appliaction.command.deleteVcsConnection;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.VCS_CONNECTION_MANAGE)
final public class DeleteVcsConnectionCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID connectionId;

    public DeleteVcsConnectionCommand(UUID projectId, UUID connectionId) {
        this.projectId = projectId;
        this.connectionId = connectionId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getConnectionId() {
        return connectionId;
    }
}
