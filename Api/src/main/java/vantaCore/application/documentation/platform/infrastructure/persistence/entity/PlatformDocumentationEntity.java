package vantaCore.application.documentation.platform.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.documentation.platform.domain.vo.PlatformGraph;
import vantaCore.application.documentation.platform.infrastructure.persistence.json.PlatformGraphJson;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.user.domain.vo.Email;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "platform_documentation_versions")
public class PlatformDocumentationEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private UUID versionId;

    private UUID projectId;

    @Column(columnDefinition = "text")
    private String architectureOverview;

    @Column(columnDefinition = "text")
    private String api;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String graph;

    private UUID changedByUserId;
    private String changedByEmail;
    private Instant changedAt;

    // Hibernate requires it
    protected PlatformDocumentationEntity() {}

    private PlatformDocumentationEntity(
        UUID versionId,
        UUID projectId,
        String architectureOverview,
        String api,
        String graph,
        UUID changedByUserId,
        String changedByEmail,
        Instant changedAt
    ) {
        this.versionId = versionId;
        this.projectId = projectId;
        this.architectureOverview = architectureOverview;
        this.api = api;
        this.graph = graph;
        this.changedByUserId = changedByUserId;
        this.changedByEmail = changedByEmail;
        this.changedAt = changedAt;
    }

    public static PlatformDocumentationEntity fromDomain(PlatformDocumentationAggregate documentation) {
        return new PlatformDocumentationEntity(
            documentation.getVersionId(),
            documentation.getProjectId().value(),
            documentation.getArchitectureOverview(),
            documentation.getApi(),
            writeGraph(documentation.getGraph()),
            documentation.getChangedBy() != null ? documentation.getChangedBy().value() : null,
            documentation.getChangedByEmail() != null ? documentation.getChangedByEmail().value() : null,
            documentation.getChangedAt()
        );
    }

    public PlatformDocumentationAggregate toDomain() {
        return new PlatformDocumentationAggregate(
            this.versionId,
            new ProjectId(this.projectId),
            this.architectureOverview,
            this.api,
            readGraph(this.graph),
            this.changedByUserId != null ? new UserId(this.changedByUserId) : null,
            this.changedByEmail != null ? new Email(this.changedByEmail) : null,
            this.changedAt
        );
    }

    private static String writeGraph(PlatformGraph graph) {
        try {
            return MAPPER.writeValueAsString(PlatformGraphJson.fromDomain(graph));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize platform documentation graph", e);
        }
    }

    private static PlatformGraph readGraph(String json) {
        try {
            return MAPPER.readValue(json, PlatformGraphJson.class).toDomain();
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize platform documentation graph", e);
        }
    }
}
