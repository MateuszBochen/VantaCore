package vantaCore.application.sso.appliaction.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Body of PUT /api/settings/sso/{provider}. clientSecret null/blank = keep the stored one (reads
 never return it - see SsoProviderConfigAggregate.configure); tenantId only applies to microsoft,
 issuerUrl/displayName only to oidc, and are ignored for the other providers. */
final public class UpsertSsoProviderRequest {

    @NotNull
    private final Boolean enabled;

    @Size(max = 255)
    private final String clientId;

    @Size(max = 2048)
    private final String clientSecret;

    @Size(max = 255)
    private final String tenantId;

    @Size(max = 2048)
    private final String issuerUrl;

    @Size(max = 255)
    private final String displayName;

    private final Boolean autoProvisionUsers;

    public UpsertSsoProviderRequest(
        Boolean enabled,
        String clientId,
        String clientSecret,
        String tenantId,
        String issuerUrl,
        String displayName,
        Boolean autoProvisionUsers
    ) {
        this.enabled = enabled;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tenantId = tenantId;
        this.issuerUrl = issuerUrl;
        this.displayName = displayName;
        this.autoProvisionUsers = autoProvisionUsers;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public String getClientId() {
        return clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getIssuerUrl() {
        return issuerUrl;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Boolean getAutoProvisionUsers() {
        return autoProvisionUsers;
    }
}
