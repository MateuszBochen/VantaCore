package vantaCore.application.vcs.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import vantaCore.application.vcs.domain.VcsConnectionAggregate;
import vantaCore.application.vcs.domain.VcsConnectionSnapshot;
import vantaCore.application.vcs.domain.vo.VcsConnectionId;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "vcs_connections")
public class VcsConnectionEntity {

    @Id
    private UUID id;

    private UUID projectId;

    @Enumerated(EnumType.STRING)
    private VcsProvider provider;

    private String repoUrl;
    private String encryptedWebhookSecret;
    private UUID createdByUserId;
    private Instant createdAt;

    // Hibernate requires it
    protected VcsConnectionEntity() {}

    private VcsConnectionEntity(
        UUID id,
        UUID projectId,
        VcsProvider provider,
        String repoUrl,
        String encryptedWebhookSecret,
        UUID createdByUserId,
        Instant createdAt
    ) {
        this.id = id;
        this.projectId = projectId;
        this.provider = provider;
        this.repoUrl = repoUrl;
        this.encryptedWebhookSecret = encryptedWebhookSecret;
        this.createdByUserId = createdByUserId;
        this.createdAt = createdAt;
    }

    public static VcsConnectionEntity fromDomain(VcsConnectionAggregate connection, String encryptedWebhookSecret) {
        return new VcsConnectionEntity(
            connection.getId().value(),
            connection.getProjectId(),
            connection.getProvider(),
            connection.getRepoUrl(),
            encryptedWebhookSecret,
            connection.getCreatedByUserId(),
            connection.getCreatedAt()
        );
    }

    public String getEncryptedWebhookSecret() {
        return encryptedWebhookSecret;
    }

    public VcsConnectionSnapshot toDomain(String decryptedWebhookSecret) {
        return new VcsConnectionSnapshot(
            new VcsConnectionId(this.id),
            this.projectId,
            this.provider,
            this.repoUrl,
            decryptedWebhookSecret,
            this.createdByUserId,
            this.createdAt
        );
    }
}
