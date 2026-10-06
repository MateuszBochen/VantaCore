package vantaCore.application.sso.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.sso.domain.vo.SsoProvider;

/** Whether a provider's email may be trusted to pick a VantaCore account. Google and GitHub say
 explicitly - only an affirmatively verified address passes. A generic OIDC IdP is trusted unless it
 explicitly says "not verified" (many don't send the claim at all). Microsoft never sends it; its
 protection is being pinned to a single tenant instead (see UpsertSsoProviderPolicy). */
@Component
final public class SsoIdentityPolicy implements PolicyInterface<SsoIdentityPolicy.Check> {

    public record Check(SsoProvider provider, Boolean emailVerified) {
    }

    @Override
    public NotificationCollection check(Check value) {
        NotificationCollection notifications = new NotificationCollection();

        boolean rejected = switch (value.provider()) {
            case GOOGLE, GITHUB -> !Boolean.TRUE.equals(value.emailVerified());
            case OIDC -> Boolean.FALSE.equals(value.emailVerified());
            case MICROSOFT -> false;
        };

        if (rejected) {
            notifications.append(new Notification(
                "sso-email-not-verified",
                "Your email address is not verified with this sign-in provider",
                true
            ));
        }

        return notifications;
    }
}
