package vantaCore.application.sso.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.sso.domain.SsoProviderConfigAggregate;
import vantaCore.application.sso.domain.vo.SsoProvider;

import java.net.URI;
import java.util.Locale;

/** Checked against the configuration as it WOULD be saved (secret already merged - see
 SsoProviderConfigAggregate.configure), so "enabled without a secret" also catches enabling a
 provider whose secret was never set. A disabled provider may be saved half-filled - that's how an
 admin drafts one before switching it on. */
@Component
final public class UpsertSsoProviderPolicy implements PolicyInterface<SsoProviderConfigAggregate> {

    @Override
    public NotificationCollection check(SsoProviderConfigAggregate config) {
        NotificationCollection notifications = new NotificationCollection();

        if (config.getIssuerUrl() != null && !isHttpsUrl(config.getIssuerUrl())) {
            notifications.append(new Notification("sso-invalid-issuer-url", "Issuer URL must be a valid https:// URL", true));
        }

        if (!config.isEnabled()) {
            return notifications;
        }

        if (config.getClientId() == null) {
            notifications.append(new Notification("sso-client-id-required", "Client ID is required to enable this provider", true));
        }
        if (!config.hasClientSecret()) {
            notifications.append(new Notification("sso-client-secret-required", "Client secret is required to enable this provider", true));
        }
        if (config.getProvider() == SsoProvider.OIDC && config.getIssuerUrl() == null) {
            notifications.append(new Notification("sso-issuer-url-required", "Issuer URL is required to enable an OIDC provider", true));
        }
        // Microsoft always needs a tenant segment for its endpoints - a specific tenant, or one of
        // the multi-tenant aliases common/organizations/consumers. Multi-tenant is allowed, but its
        // email is then only trusted from verified sources (see MicrosoftSsoClient.toIdentity).
        if (config.getProvider() == SsoProvider.MICROSOFT && config.getTenantId() == null) {
            notifications.append(new Notification(
                "sso-tenant-id-required",
                "A Directory (tenant) ID is required to enable Microsoft - a tenant ID, or common/organizations/consumers",
                true
            ));
        }

        return notifications;
    }

    public static boolean isSingleTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return false;
        }
        String normalized = tenantId.trim().toLowerCase(Locale.ROOT);
        return !normalized.equals("common") && !normalized.equals("organizations") && !normalized.equals("consumers");
    }

    private boolean isHttpsUrl(String value) {
        try {
            URI uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
