package vantaCore.application.documentation.search.appliaction.query.askDocumentation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.documentation.search.appliaction.dto.AskDocumentationRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

// Reuses DOCUMENTATION_VIEW (same gate as reading the graph itself) rather than a new resource -
// asking a question about a project's documentation is a read of that documentation, access-wise.
@RequiresResource(Resource.DOCUMENTATION_VIEW)
final public class AskDocumentationQuery {

    @NotNull
    private final UUID projectId;

    @Valid
    @NotNull
    private final AskDocumentationRequest askDocumentationRequest;

    public AskDocumentationQuery(UUID projectId, AskDocumentationRequest askDocumentationRequest) {
        this.projectId = projectId;
        this.askDocumentationRequest = askDocumentationRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public AskDocumentationRequest getAskDocumentationRequest() {
        return askDocumentationRequest;
    }
}
