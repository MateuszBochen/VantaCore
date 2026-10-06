package vantaCore.application.sso.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.vo.SsoProvider;

import java.time.Instant;

@Entity
@Table(name = "sso_provider_configs")
public class SsoProviderConfigEntity {

    @Id
    @Enumerated(EnumType.STRING)
    private SsoProvider provider;

    private boolean enabled;
    private String clientId;

    @Column(columnDefinition = "text")
    private String encryptedClientSecret;

    private String tenantId;

    @Column(length = 2048)
    private String issuerUrl;

    private String displayName;
    private boolean autoProvisionUsers;
    private Instant updatedAt;

    // Hibernate requires it
    protected SsoProviderConfigEntity() {}

    private SsoProviderConfigEntity(
        SsoProvider provider,
        boolean enabled,
        String clientId,
        String encryptedClientSecret,
        String tenantId,
        String issuerUrl,
        String displayName,
        boolean autoProvisionUsers,
        Instant updatedAt
    ) {
        this.provider = provider;
        this.enabled = enabled;
        this.clientId = clientId;
        this.encryptedClientSecret = encryptedClientSecret;
        this.tenantId = tenantId;
        this.issuerUrl = issuerUrl;
        this.displayName = displayName;
        this.autoProvisionUsers = autoProvisionUsers;
        this.updatedAt = updatedAt;
    }

    public static SsoProviderConfigEntity fromDomain(SsoProviderConfigAggregate config, String encryptedClientSecret) {
        return new SsoProviderConfigEntity(
            config.getProvider(),
            config.isEnabled(),
            config.getClientId(),
            encryptedClientSecret,
            config.getTenantId(),
            config.getIssuerUrl(),
            config.getDisplayName(),
            config.isAutoProvisionUsers(),
            config.getUpdatedAt()
        );
    }

    public SsoProviderConfigAggregate toDomain(String clientSecret) {
        return SsoProviderConfigAggregate.restore(
            this.provider,
            this.enabled,
            this.clientId,
            clientSecret,
            this.tenantId,
            this.issuerUrl,
            this.displayName,
            this.autoProvisionUsers,
            this.updatedAt
        );
    }

    public String getEncryptedClientSecret() {
        return encryptedClientSecret;
    }
}
