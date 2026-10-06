package vantaCore.application.subProject.domain;

import vantaCore.application.subProject.domain.vo.SubProjectDocumentation;
import vantaCore.application.subProject.domain.vo.SubProjectId;
import vantaCore.application.subProject.domain.vo.SubProjectName;
import vantaCore.application.subProject.domain.vo.SubProjectStatus;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.user.domain.vo.Email;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.UUID;

public class SubProjectAggregate {
    private final UUID versionId;
    private final SubProjectId subProjectId;
    private final ProjectId projectId;
    private final SubProjectName name;
    private final SubProjectStatus status;
    private final SubProjectDocumentation documentation;
    private final UserId changedBy;
    private final Email changedByEmail;
    private final Instant changedAt;

    public SubProjectAggregate(
        UUID versionId,
        SubProjectId subProjectId,
        ProjectId projectId,
        SubProjectName name,
        SubProjectStatus status,
        SubProjectDocumentation documentation,
        UserId changedBy,
        Email changedByEmail,
        Instant changedAt
    ) {
        this.versionId = versionId;
        this.subProjectId = subProjectId;
        this.projectId = projectId;
        this.name = name;
        this.status = status;
        this.documentation = documentation;
        this.changedBy = changedBy;
        this.changedByEmail = changedByEmail;
        this.changedAt = changedAt;
    }

    public UUID getVersionId() {
        return versionId;
    }

    public SubProjectId getSubProjectId() {
        return subProjectId;
    }

    public ProjectId getProjectId() {
        return projectId;
    }

    public SubProjectName getName() {
        return name;
    }

    public SubProjectStatus getStatus() {
        return status;
    }

    public SubProjectDocumentation getDocumentation() {
        return documentation;
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
