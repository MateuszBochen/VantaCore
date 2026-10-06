package vantaCore.application.release.appliaction.command.upsertRelease;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.release.appliaction.dto.UpsertReleaseRequest;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.RELEASE_MANAGE)
final public class UpsertReleaseCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID releaseId;

    @Valid
    @NotNull
    private final UpsertReleaseRequest upsertReleaseRequest;

    public UpsertReleaseCommand(UUID projectId, UUID releaseId, UpsertReleaseRequest upsertReleaseRequest) {
        this.projectId = projectId;
        this.releaseId = releaseId;
        this.upsertReleaseRequest = upsertReleaseRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getReleaseId() {
        return releaseId;
    }

    public UpsertReleaseRequest getUpsertReleaseRequest() {
        return upsertReleaseRequest;
    }
}
