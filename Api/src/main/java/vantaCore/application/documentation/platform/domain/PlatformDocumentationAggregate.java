package vantaCore.application.documentation.platform.domain;

import vantaCore.application.documentation.platform.domain.vo.PlatformGraph;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.user.domain.vo.Email;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.UUID;

public class PlatformDocumentationAggregate {
    private final UUID versionId;
    private final ProjectId projectId;
    private final String architectureOverview;
    private final String api;
    private final PlatformGraph graph;
    private final UserId changedBy;
    private final Email changedByEmail;
    private final Instant changedAt;

    public PlatformDocumentationAggregate(
        UUID versionId,
        ProjectId projectId,
        String architectureOverview,
        String api,
        PlatformGraph graph,
        UserId changedBy,
        Email changedByEmail,
        Instant changedAt
    ) {
        this.versionId = versionId;
        this.projectId = projectId;
        this.architectureOverview = architectureOverview;
        this.api = api;
        this.graph = graph;
        this.changedBy = changedBy;
        this.changedByEmail = changedByEmail;
        this.changedAt = changedAt;
    }

    public UUID getVersionId() {
        return versionId;
    }

    public ProjectId getProjectId() {
        return projectId;
    }

    public String getArchitectureOverview() {
        return architectureOverview;
    }

    public String getApi() {
        return api;
    }

    public PlatformGraph getGraph() {
        return graph;
    }

    public UserId getChangedBy() {
        return changedBy;
    }

    public Email getChangedByEmail() {
        return changedByEmail;
    }

    public Instant getChangedAt() {
        return changedAt;
    }
}
