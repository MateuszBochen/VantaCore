package vantaCore.application.subProject.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.vo.Adr;
import vantaCore.application.subProject.domain.vo.SubProjectDocumentation;
import vantaCore.application.subProject.domain.vo.SubProjectId;
import vantaCore.application.subProject.domain.vo.SubProjectName;
import vantaCore.application.subProject.domain.vo.SubProjectStatus;
import vantaCore.application.subProject.infrastructure.persistence.json.AdrJson;
import vantaCore.application.user.domain.vo.Email;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "sub_project_versions")
public class SubProjectEntity {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id
    private UUID versionId;

    private UUID subProjectId;
    private UUID projectId;
    private String name;

    @Enumerated(EnumType.STRING)
    private SubProjectStatus status;

    @Column(columnDefinition = "text")
    private String scope;

    @Column(columnDefinition = "text")
    private String impactAnalysis;

    @Column(columnDefinition = "text")
    private String solutionDesign;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String adrs;

    private UUID changedByUserId;
    private String changedByEmail;
    private Instant changedAt;

    // Hibernate requires it
    protected SubProjectEntity() {}

    private SubProjectEntity(
        UUID versionId,
        UUID subProjectId,
        UUID projectId,
        String name,
        SubProjectStatus status,
        String scope,
        String impactAnalysis,
        String solutionDesign,
        String adrs,
        UUID changedByUserId,
        String changedByEmail,
        Instant changedAt
    ) {
        this.versionId = versionId;
        this.subProjectId = subProjectId;
        this.projectId = projectId;
        this.name = name;
        this.status = status;
        this.scope = scope;
        this.impactAnalysis = impactAnalysis;
        this.solutionDesign = solutionDesign;
        this.adrs = adrs;
        this.changedByUserId = changedByUserId;
        this.changedByEmail = changedByEmail;
        this.changedAt = changedAt;
    }

    public static SubProjectEntity fromDomain(SubProjectAggregate subProject) {
        SubProjectDocumentation documentation = subProject.getDocumentation();

        return new SubProjectEntity(
            subProject.getVersionId(),
            subProject.getSubProjectId().value(),
            subProject.getProjectId().value(),
            subProject.getName() != null ? subProject.getName().value() : null,
            subProject.getStatus(),
            documentation != null ? documentation.scope() : null,
            documentation != null ? documentation.impactAnalysis() : null,
            documentation != null ? documentation.solutionDesign() : null,
            writeAdrs(documentation),
            subProject.getChangedBy() != null ? subProject.getChangedBy().value() : null,
            subProject.getChangedByEmail() != null ? subProject.getChangedByEmail().value() : null,
            subProject.getChangedAt()
        );
    }

    public SubProjectAggregate toDomain() {
        return new SubProjectAggregate(
            this.versionId,
            new SubProjectId(this.subProjectId),
            new ProjectId(this.projectId),
            this.name != null ? new SubProjectName(this.name) : null,
            this.status,
            new SubProjectDocumentation(this.scope, this.impactAnalysis, this.solutionDesign, readAdrs(this.adrs)),
            this.changedByUserId != null ? new UserId(this.changedByUserId) : null,
            this.changedByEmail != null ? new Email(this.changedByEmail) : null,
            this.changedAt
        );
    }

    private static String writeAdrs(SubProjectDocumentation documentation) {
        Set<Adr> adrs = documentation != null ? documentation.adrs() : Set.of();

        try {
            AdrJson[] adrJsons = adrs.stream().map(AdrJson::fromDomain).toArray(AdrJson[]::new);
            return MAPPER.writeValueAsString(adrJsons);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize sub-project ADRs", e);
        }
    }

    private static Set<Adr> readAdrs(String json) {
        try {
            AdrJson[] adrJsons = MAPPER.readValue(json, AdrJson[].class);
            return Arrays.stream(adrJsons).map(AdrJson::toDomain).collect(Collectors.toSet());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize sub-project ADRs", e);
        }
    }
}
