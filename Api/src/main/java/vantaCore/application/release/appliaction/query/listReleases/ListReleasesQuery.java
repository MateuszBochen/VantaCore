package vantaCore.application.release.appliaction.query.listReleases;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.RELEASE_VIEW)
final public class ListReleasesQuery {

    @NotNull
    private final UUID projectId;

    @Min(0)
    private final int page;

    @Min(1)
    private final int limit;

    public ListReleasesQuery(UUID projectId, int page, int limit) {
        this.projectId = projectId;
        this.page = page;
        this.limit = limit;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }
}
