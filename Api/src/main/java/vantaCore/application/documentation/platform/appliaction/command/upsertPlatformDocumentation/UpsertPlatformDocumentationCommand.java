package vantaCore.application.documentation.platform.appliaction.command.upsertPlatformDocumentation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.documentation.platform.appliaction.dto.UpsertPlatformDocumentationRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.DOCUMENTATION_UPDATE)
final public class UpsertPlatformDocumentationCommand {

    @NotNull
    private final UUID projectId;

    @Valid
    @NotNull
    private final UpsertPlatformDocumentationRequest upsertPlatformDocumentationRequest;

    public UpsertPlatformDocumentationCommand(
        UUID projectId,
        UpsertPlatformDocumentationRequest upsertPlatformDocumentationRequest
    ) {
        this.projectId = projectId;
        this.upsertPlatformDocumentationRequest = upsertPlatformDocumentationRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UpsertPlatformDocumentationRequest getUpsertPlatformDocumentationRequest() {
        return upsertPlatformDocumentationRequest;
    }
}
