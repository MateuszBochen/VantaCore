package vantaCore.application.vcs.appliaction.query.createVcsConnection;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.vcs.appliaction.dto.CreateVcsConnectionRequest;

import java.util.UUID;

// QueryBus, not CommandBus - needs to hand back the server-generated id, webhookUrl and
// webhookSecret (same "needs to hand back a result" precedent as CreateImportConnectionQuery).
@RequiresResource(Resource.VCS_CONNECTION_MANAGE)
final public class CreateVcsConnectionQuery {

    @NotNull
    private final UUID projectId;

    @Valid
    @NotNull
    private final CreateVcsConnectionRequest createVcsConnectionRequest;

    public CreateVcsConnectionQuery(UUID projectId, CreateVcsConnectionRequest createVcsConnectionRequest) {
        this.projectId = projectId;
        this.createVcsConnectionRequest = createVcsConnectionRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public CreateVcsConnectionRequest getCreateVcsConnectionRequest() {
        return createVcsConnectionRequest;
    }
}
