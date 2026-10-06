package vantaCore.application.importExport.appliaction.query.createImportConnection;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.importExport.appliaction.dto.CreateImportConnectionRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

// Dispatched via QueryBus rather than CommandBus even though it persists a new row - it needs to
// hand back the server-generated connectionId, which a Void-returning CommandBus can't do (same
// "needs to hand back a result" precedent as LoginQuery/BulkUpdateTicketsQuery in CLAUDE.md).
@RequiresResource(Resource.IMPORT_MANAGE)
final public class CreateImportConnectionQuery {

    @NotNull
    private final UUID projectId;

    @Valid
    @NotNull
    private final CreateImportConnectionRequest createImportConnectionRequest;

    public CreateImportConnectionQuery(UUID projectId, CreateImportConnectionRequest createImportConnectionRequest) {
        this.projectId = projectId;
        this.createImportConnectionRequest = createImportConnectionRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public CreateImportConnectionRequest getCreateImportConnectionRequest() {
        return createImportConnectionRequest;
    }
}
