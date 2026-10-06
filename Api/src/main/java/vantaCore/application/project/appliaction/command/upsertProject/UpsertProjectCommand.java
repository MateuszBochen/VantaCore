package vantaCore.application.project.appliaction.command.upsertProject;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.project.appliaction.dto.UpsertProjectRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.util.UUID;

@RequiresResource(Resource.PROJECT_MANAGE)
@Audited(AuditResourceType.PROJECT)
final public class UpsertProjectCommand implements AuditableCommand {

    @NotNull
    private final UUID projectId;

    @Valid
    @NotNull
    private final UpsertProjectRequest upsertProjectRequest;

    public UpsertProjectCommand(UUID projectId, UpsertProjectRequest upsertProjectRequest) {
        this.projectId = projectId;
        this.upsertProjectRequest = upsertProjectRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UpsertProjectRequest getUpsertProjectRequest() {
        return upsertProjectRequest;
    }

    @Override
    public UUID getAuditProjectId() {
        return projectId;
    }

    @Override
    public UUID getAuditResourceId() {
        return projectId;
    }
}
