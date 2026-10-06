package vantaCore.application.auditLog.appliaction.query.listAuditLog;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.auditLog.domain.AuditAction;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.shared.domain.audit.AuditResourceType;

import java.time.Instant;
import java.util.UUID;

// Its own permission (not e.g. reusing PROJECT_VIEW) per the Audit Log sub-project's own risk
// analysis: "who can read the audit log needs its own permission check".
@RequiresResource(Resource.AUDIT_LOG_VIEW)
final public class ListAuditLogQuery {

    @NotNull
    private final UUID projectId;

    private final UUID actorId;
    private final AuditResourceType resourceType;
    private final AuditAction action;
    private final Instant from;
    private final Instant till;

    @Min(0)
    private final int page;

    @Min(1)
    private final int limit;

    public ListAuditLogQuery(
        UUID projectId,
        UUID actorId,
        AuditResourceType resourceType,
        AuditAction action,
        Instant from,
        Instant till,
        int page,
        int limit
    ) {
        this.projectId = projectId;
        this.actorId = actorId;
        this.resourceType = resourceType;
        this.action = action;
        this.from = from;
        this.till = till;
        this.page = page;
        this.limit = limit;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getActorId() {
        return actorId;
    }

    public AuditResourceType getResourceType() {
        return resourceType;
    }

    public AuditAction getAction() {
        return action;
    }

    public Instant getFrom() {
        return from;
    }

    public Instant getTill() {
        return till;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }
}
