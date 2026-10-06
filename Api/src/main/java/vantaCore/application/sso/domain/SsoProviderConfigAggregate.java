package vantaCore.application.sso.domain;

import vantaCore.application.sso.domain.vo.SsoProvider;

import java.time.Instant;

/** One SSO provider's configuration - identified by its provider alone (at most one row per
 SsoProvider), so there's no separate id. clientSecret is held in plaintext here and only
 encrypted at rest by the repository adapter (see JpaSsoProviderConfigRepositoryAdapter), same split
 as ImportConnection/VcsConnection's own credentials - it never leaves the API: reads only expose
 whether one is set.

 Fields that don't apply to the provider (tenantId outside MICROSOFT, issuerUrl/displayName
 outside OIDC) are dropped to null on configure(), so a stale value typed into the wrong form can't
 linger unused in storage. */
public class SsoProviderConfigAggregate {
    private final SsoProvider provider;
    private final boolean enabled;
    private final String clientId;
    private final String clientSecret;
    private final String tenantId;
    private final String issuerUrl;
    private final String displayName;
    private final boolean autoProvisionUsers;
    private final Instant updatedAt;

    private SsoProviderConfigAggregate(
        SsoProvider provider,
        boolean enabled,
        String clientId,
        String clientSecret,
        String tenantId,
        String issuerUrl,
        String displayName,
        boolean autoProvisionUsers,
        Instant updatedAt
    ) {
        if (provider == null) {
            throw new IllegalArgumentException("SsoProviderConfig provider cannot be null");
        }

        this.provider = provider;
        this.enabled = enabled;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tenantId = provider == SsoProvider.MICROSOFT ? tenantId : null;
        this.issuerUrl = provider == SsoProvider.OIDC ? issuerUrl : null;
        this.displayName = provider == SsoProvider.OIDC ? displayName : null;
        this.autoProvisionUsers = autoProvisionUsers;
        this.updatedAt = updatedAt;
    }

    /** A provider nobody has configured yet - disabled, empty. What GET reports for it. */
    public static SsoProviderConfigAggregate notConfigured(SsoProvider provider) {
        return new SsoProviderConfigAggregate(provider, false, null, null, null, null, null, false, null);
    }

    /** Rebuild from storage - every field supplied as persisted. */
    public static SsoProviderConfigAggregate restore(
        SsoProvider provider,
        boolean enabled,
        String clientId,
        String clientSecret,
        String tenantId,
        String issuerUrl,
        String displayName,
        boolean autoProvisionUsers,
        Instant updatedAt
    ) {
        return new SsoProviderConfigAggregate(
            provider, enabled, clientId, clientSecret, tenantId, issuerUrl, displayName, autoProvisionUsers, updatedAt
        );
    }

    /** Full replace of the editable fields, except the secret: a null/blank newClientSecret KEEPS the
     current one, since reads never return it and the settings form can't resend what it never had
     - only a non-blank value replaces it. Blank strings elsewhere are normalized to null. */
    public SsoProviderConfigAggregate configure(
        boolean enabled,
        String clientId,
        String newClientSecret,
        String tenantId,
        String issuerUrl,
        String displayName,
        boolean autoProvisionUsers,
        Instant now
    ) {
        String secret = isBlank(newClientSecret) ? this.clientSecret : newClientSecret;

        return new SsoProviderConfigAggregate(
            this.provider,
            enabled,
            trimToNull(clientId),
            secret,
            trimToNull(tenantId),
            trimToNull(issuerUrl),
            trimToNull(displayName),
            autoProvisionUsers,
            now
        );
    }

    public boolean hasClientSecret() {
        return !isBlank(this.clientSecret);
    }

    public SsoProvider getProvider() {
        return provider;
    }

    public boolean isEnabled() {
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

    public boolean isAutoProvisionUsers() {
        return autoProvisionUsers;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}
