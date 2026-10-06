package vantaCore.application.importExport.appliaction.query.getImportJob;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.IMPORT_VIEW)
final public class GetImportJobQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID importJobId;

    public GetImportJobQuery(UUID projectId, UUID importJobId) {
        this.projectId = projectId;
        this.importJobId = importJobId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getImportJobId() {
        return importJobId;
    }
}
