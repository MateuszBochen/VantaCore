package vantaCore.application.subProject.appliaction.command.upsertSubProject;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.application.subProject.appliaction.dto.UpsertSubProjectRequest;

import java.util.UUID;

@RequiresResource(Resource.SUBPROJECT_MANAGE)
@Audited(AuditResourceType.SUB_PROJECT)
final public class UpsertSubProjectCommand implements AuditableCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subProjectId;

    @Valid
    @NotNull
    private final UpsertSubProjectRequest upsertSubProjectRequest;

    public UpsertSubProjectCommand(UUID projectId, UUID subProjectId, UpsertSubProjectRequest upsertSubProjectRequest) {
        this.projectId = projectId;
        this.subProjectId = subProjectId;
        this.upsertSubProjectRequest = upsertSubProjectRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getSubProjectId() {
        return subProjectId;
    }

    public UpsertSubProjectRequest getUpsertSubProjectRequest() {
        return upsertSubProjectRequest;
    }

    @Override
    public UUID getAuditProjectId() {
        return projectId;
    }

    @Override
    public UUID getAuditResourceId() {
        return subProjectId;
    }
}
