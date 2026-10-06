package vantaCore.application.subProject.appliaction.command.deploySubProject;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.util.UUID;

@RequiresResource(Resource.SUBPROJECT_DEPLOY)
@Audited(AuditResourceType.SUB_PROJECT)
final public class DeploySubProjectCommand implements AuditableCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subProjectId;

    public DeploySubProjectCommand(UUID projectId, UUID subProjectId) {
        this.projectId = projectId;
        this.subProjectId = subProjectId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getSubProjectId() {
        return subProjectId;
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
