package vantaCore.application.importExport.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import vantaCore.application.importExport.domain.ImportConnectionAggregate;
import vantaCore.application.importExport.domain.ImportConnectionSnapshot;
import vantaCore.application.importExport.domain.vo.ImportConnectionId;
import vantaCore.application.importExport.domain.vo.ImportProvider;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "import_connections")
public class ImportConnectionEntity {

    @Id
    private UUID id;

    private UUID projectId;

    @Enumerated(EnumType.STRING)
    private ImportProvider provider;

    private String baseUrl;
    private String sourceProject;
    private String email;
    private String encryptedToken;
    private UUID createdByUserId;
    private Instant createdAt;

    // Hibernate requires it
    protected ImportConnectionEntity() {}

    private ImportConnectionEntity(
        UUID id,
        UUID projectId,
        ImportProvider provider,
        String baseUrl,
        String sourceProject,
        String email,
        String encryptedToken,
        UUID createdByUserId,
        Instant createdAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.provider = provider;
        this.baseUrl = baseUrl;
        this.sourceProject = sourceProject;
        this.email = email;
        this.encryptedToken = encryptedToken;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
    }

    public static ImportConnectionEntity fromDomain(ImportConnectionAggregate connection, String encryptedToken) {
        return new ImportConnectionEntity(
            connection.getId().value(),
            connection.getProjectId(),
            connection.getProvider(),
            connection.getBaseUrl(),
            connection.getSourceProject(),
            connection.getEmail(),
            encryptedToken,
            connection.getCreatedByUserId(),
            connection.getCreatedAt()
        );
    }

    public String getEncryptedToken() {
        return encryptedToken;
    }

    public ImportConnectionSnapshot toDomain(String decryptedToken) {
        return new ImportConnectionSnapshot(
            new ImportConnectionId(this.id),
            this.projectId,
            this.provider,
            this.baseUrl,
            this.sourceProject,
            this.email,
            decryptedToken,
            this.createdByUserId,
            this.createdAt
        );
    }
}
