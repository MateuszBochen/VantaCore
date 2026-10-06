package vantaCore.application.importExport.appliaction.query.previewImportConnection;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.IMPORT_MANAGE)
final public class PreviewImportConnectionQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID connectionId;

    public PreviewImportConnectionQuery(UUID projectId, UUID connectionId) {
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
