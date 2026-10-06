package vantaCore.application.documentation.search.appliaction.command.reindexProjectDocumentation;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

// Same gate as PUT-ing the documentation itself - triggering a reindex causes the same write
// (documentation_chunks) a save's event handler would, just without changing the source content.
@RequiresResource(Resource.DOCUMENTATION_UPDATE)
final public class ReindexProjectDocumentationCommand {

    @NotNull
    private final UUID projectId;

    public ReindexProjectDocumentationCommand(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
